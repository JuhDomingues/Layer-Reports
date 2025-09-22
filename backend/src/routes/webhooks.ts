import express from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { config } from '../config';

const router = express.Router();

interface FacebookWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: {
        campaign_id?: string;
        adset_id?: string;
        ad_id?: string;
        event_type: string;
        object_story_spec?: any;
        updated_fields?: string[];
      };
    }>;
  }>;
}

/**
 * Verify Facebook webhook signature
 */
function verifyWebhookSignature(signature: string, body: string): boolean {
  if (!config.FACEBOOK_APP_SECRET) {
    logger.error('Facebook app secret not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.FACEBOOK_APP_SECRET)
    .update(body, 'utf8')
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}

/**
 * Handle Facebook webhook verification
 */
router.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
      logger.info('Facebook webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('Facebook webhook verification failed', { mode, token });
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/**
 * Handle Facebook webhook events
 */
router.post('/facebook', express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-hub-signature-256'] as string;
    const body = req.body.toString();

    // Verify signature
    if (!signature || !verifyWebhookSignature(signature, body)) {
      logger.error('Invalid webhook signature');
      throw new AppError('Invalid webhook signature', 403, 'INVALID_SIGNATURE');
    }

    try {
      const payload: FacebookWebhookPayload = JSON.parse(body);
      
      logger.info('Received Facebook webhook', {
        object: payload.object,
        entriesCount: payload.entry?.length || 0
      });

      // Process webhook events
      await processWebhookEvents(payload);

      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).send('ERROR_PROCESSING_WEBHOOK');
    }
  })
);

/**
 * Process webhook events
 */
async function processWebhookEvents(payload: FacebookWebhookPayload): Promise<void> {
  if (payload.object !== 'page') {
    logger.debug('Ignoring non-page webhook event', { object: payload.object });
    return;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      try {
        await processWebhookChange(entry.id, change);
      } catch (error) {
        logger.error('Error processing webhook change:', {
          error,
          entryId: entry.id,
          change
        });
      }
    }
  }
}

/**
 * Process individual webhook change
 */
async function processWebhookChange(
  entryId: string,
  change: FacebookWebhookPayload['entry'][0]['changes'][0]
): Promise<void> {
  const { field, value } = change;

  switch (field) {
    case 'ads':
      await handleAdChange(value);
      break;
    case 'campaigns':
      await handleCampaignChange(value);
      break;
    case 'adsets':
      await handleAdSetChange(value);
      break;
    default:
      logger.debug('Unhandled webhook field', { field, value });
  }
}

/**
 * Handle campaign changes
 */
async function handleCampaignChange(value: any): Promise<void> {
  const { campaign_id, event_type, updated_fields } = value;

  if (!campaign_id) {
    logger.warn('Campaign webhook without campaign_id', { value });
    return;
  }

  logger.info('Processing campaign webhook', {
    campaignId: campaign_id,
    eventType: event_type,
    updatedFields: updated_fields
  });

  // Find the campaign in our database
  const campaign = await prisma.campaign.findFirst({
    where: { facebookCampaignId: campaign_id },
    include: { account: true }
  });

  if (!campaign) {
    logger.debug('Campaign not found in database', { campaignId: campaign_id });
    return;
  }

  // Mark campaign for sync
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      needsSync: true,
      lastWebhookAt: new Date()
    }
  });

  // Queue background sync job
  await queueCampaignSync(campaign.id, campaign.facebookCampaignId, event_type);

  logger.info('Campaign marked for sync', {
    localCampaignId: campaign.id,
    facebookCampaignId: campaign_id,
    eventType: event_type
  });
}

/**
 * Handle ad changes
 */
async function handleAdChange(value: any): Promise<void> {
  const { ad_id, campaign_id, event_type } = value;

  logger.info('Processing ad webhook', {
    adId: ad_id,
    campaignId: campaign_id,
    eventType: event_type
  });

  // If we have a campaign_id, mark the campaign for sync
  if (campaign_id) {
    const campaign = await prisma.campaign.findFirst({
      where: { facebookCampaignId: campaign_id }
    });

    if (campaign) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          needsSync: true,
          lastWebhookAt: new Date()
        }
      });

      // Queue insight sync since ad changes might affect metrics
      await queueInsightSync(campaign.id, campaign_id);
    }
  }
}

/**
 * Handle adset changes
 */
async function handleAdSetChange(value: any): Promise<void> {
  const { adset_id, campaign_id, event_type } = value;

  logger.info('Processing adset webhook', {
    adsetId: adset_id,
    campaignId: campaign_id,
    eventType: event_type
  });

  // Similar to ad changes, mark campaign for sync
  if (campaign_id) {
    const campaign = await prisma.campaign.findFirst({
      where: { facebookCampaignId: campaign_id }
    });

    if (campaign) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          needsSync: true,
          lastWebhookAt: new Date()
        }
      });
    }
  }
}

/**
 * Queue campaign sync job
 */
async function queueCampaignSync(
  localCampaignId: string,
  facebookCampaignId: string,
  eventType: string
): Promise<void> {
  // Create sync job record
  await prisma.syncJob.create({
    data: {
      type: 'CAMPAIGN_SYNC',
      entityId: localCampaignId,
      facebookEntityId: facebookCampaignId,
      status: 'PENDING',
      metadata: { eventType, source: 'webhook' },
      scheduledAt: new Date()
    }
  });

  logger.info('Campaign sync job queued', {
    localCampaignId,
    facebookCampaignId,
    eventType
  });
}

/**
 * Queue insight sync job
 */
async function queueInsightSync(
  localCampaignId: string,
  facebookCampaignId: string
): Promise<void> {
  // Create insight sync job for last 7 days
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  await prisma.syncJob.create({
    data: {
      type: 'INSIGHT_SYNC',
      entityId: localCampaignId,
      facebookEntityId: facebookCampaignId,
      status: 'PENDING',
      metadata: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        source: 'webhook'
      },
      scheduledAt: new Date()
    }
  });

  logger.info('Insight sync job queued', {
    localCampaignId,
    facebookCampaignId,
    dateRange: { startDate, endDate }
  });
}

/**
 * Get webhook health status
 */
router.get('/health', asyncHandler(async (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count recent webhook events
  const recentCampaignUpdates = await prisma.campaign.count({
    where: {
      lastWebhookAt: {
        gte: last24Hours
      }
    }
  });

  // Count pending sync jobs
  const pendingSyncJobs = await prisma.syncJob.count({
    where: {
      status: 'PENDING'
    }
  });

  res.json({
    status: 'healthy',
    webhookEvents: {
      last24Hours: recentCampaignUpdates
    },
    syncJobs: {
      pending: pendingSyncJobs
    },
    timestamp: now
  });
}));

export default router;