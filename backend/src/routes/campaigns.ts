import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { requireAuth, requireFacebookToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  validateAccountId, 
  validateCampaignId, 
  validateCampaignQuery 
} from '../middleware/validation';
import { FacebookApiService } from '../services/facebookApi';

const router = express.Router();

/**
 * Get campaigns for a specific account
 */
router.get('/:accountId', requireAuth, requireFacebookToken, validateAccountId, validateCampaignQuery,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;
    const { 
      status = 'all', 
      limit = 50, 
      offset = 0,
      sync = 'false'
    } = req.query;

    // Verify user has access to this account
    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        facebookAccountId: accountId,
        isActive: true
      }
    });

    if (!account) {
      throw new AppError('Account not found or access denied', 404, 'ACCOUNT_NOT_FOUND');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new AppError('Facebook token not found', 404, 'FACEBOOK_TOKEN_NOT_FOUND');
    }

    // If sync is requested, fetch fresh data from Facebook
    if (sync === 'true') {
      await syncCampaigns(accountId, account.id, user.facebookAccessToken, status as string);
    }

    // Build query conditions
    const whereConditions: any = {
      accountId: account.id
    };

    if (status !== 'all') {
      whereConditions.status = (status as string).toUpperCase();
    }

    // Get campaigns from database
    const campaigns = await prisma.campaign.findMany({
      where: whereConditions,
      orderBy: { updatedAt: 'desc' },
      skip: parseInt(offset as string),
      take: parseInt(limit as string),
      select: {
        id: true,
        facebookCampaignId: true,
        name: true,
        status: true,
        objective: true,
        dailyBudget: true,
        lifetimeBudget: true,
        bidStrategy: true,
        createdAt: true,
        updatedAt: true,
        lastSyncAt: true,
        insights: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { date: 'desc' },
          take: 1,
          select: {
            impressions: true,
            clicks: true,
            spend: true,
            ctr: true,
            cpc: true,
            conversions: true,
            conversionRate: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.campaign.count({
      where: whereConditions
    });

    // Format response
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.facebookCampaignId,
      localId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      dailyBudget: campaign.dailyBudget,
      lifetimeBudget: campaign.lifetimeBudget,
      bidStrategy: campaign.bidStrategy,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      lastSyncAt: campaign.lastSyncAt,
      currentMetrics: campaign.insights[0] || null
    }));

    res.json({
      campaigns: formattedCampaigns,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < totalCount
      },
      meta: {
        accountId,
        status,
        lastSync: account.updatedAt
      }
    });
  })
);

/**
 * Get specific campaign details
 */
router.get('/:accountId/:campaignId', requireAuth, requireFacebookToken, 
  validateAccountId, validateCampaignId,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, campaignId } = req.params;

    // Verify access
    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        facebookAccountId: accountId,
        isActive: true
      }
    });

    if (!account) {
      throw new AppError('Account not found or access denied', 404, 'ACCOUNT_NOT_FOUND');
    }

    // Get campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        accountId: account.id,
        facebookCampaignId: campaignId
      },
      include: {
        insights: {
          orderBy: { date: 'desc' },
          take: 90 // Last 90 days
        }
      }
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    res.json({ campaign });
  })
);

/**
 * Sync campaigns from Facebook API
 */
router.post('/:accountId/sync', requireAuth, requireFacebookToken, validateAccountId,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;
    const { status = 'all' } = req.body;

    // Verify access
    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        facebookAccountId: accountId,
        isActive: true
      }
    });

    if (!account) {
      throw new AppError('Account not found or access denied', 404, 'ACCOUNT_NOT_FOUND');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new AppError('Facebook token not found', 404, 'FACEBOOK_TOKEN_NOT_FOUND');
    }

    // Perform sync
    const syncResult = await syncCampaigns(
      accountId, 
      account.id, 
      user.facebookAccessToken, 
      status
    );

    logger.info('Campaigns sync completed', {
      userId: req.user!.id,
      accountId,
      ...syncResult
    });

    res.json({
      message: 'Campaigns synced successfully',
      ...syncResult
    });
  })
);

/**
 * Update campaign status (pause/resume)
 */
router.patch('/:accountId/:campaignId/status', requireAuth, requireFacebookToken,
  validateAccountId, validateCampaignId,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, campaignId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'PAUSED'].includes(status)) {
      throw new AppError('Invalid status. Must be ACTIVE or PAUSED', 400, 'INVALID_STATUS');
    }

    // Verify access
    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        facebookAccountId: accountId,
        isActive: true
      }
    });

    if (!account) {
      throw new AppError('Account not found or access denied', 404, 'ACCOUNT_NOT_FOUND');
    }

    // Note: This would require Facebook Marketing API write permissions
    // For now, we'll just update the local database
    const campaign = await prisma.campaign.findFirst({
      where: {
        accountId: account.id,
        facebookCampaignId: campaignId
      }
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: status,
        updatedAt: new Date()
      }
    });

    logger.info('Campaign status updated', {
      userId: req.user!.id,
      accountId,
      campaignId,
      newStatus: status
    });

    res.json({
      message: 'Campaign status updated successfully',
      campaign: updatedCampaign
    });
  })
);

/**
 * Helper function to sync campaigns
 */
async function syncCampaigns(
  facebookAccountId: string,
  localAccountId: string,
  accessToken: string,
  status: string = 'all'
): Promise<{ created: number; updated: number; total: number }> {
  const facebookApi = new FacebookApiService(accessToken);
  
  // Fetch campaigns from Facebook
  const facebookData = await facebookApi.getCampaigns(
    facebookAccountId,
    status !== 'all' ? status : undefined,
    100 // Fetch more campaigns
  );

  let created = 0;
  let updated = 0;

  // Process each campaign
  for (const fbCampaign of facebookData.campaigns) {
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        accountId: localAccountId,
        facebookCampaignId: fbCampaign.id
      }
    });

    const campaignData = {
      name: fbCampaign.name,
      status: fbCampaign.status,
      objective: fbCampaign.objective,
      dailyBudget: fbCampaign.daily_budget ? parseFloat(fbCampaign.daily_budget) : null,
      lifetimeBudget: fbCampaign.lifetime_budget ? parseFloat(fbCampaign.lifetime_budget) : null,
      bidStrategy: fbCampaign.bid_strategy,
      lastSyncAt: new Date(),
      updatedAt: new Date()
    };

    if (existingCampaign) {
      // Update existing campaign
      await prisma.campaign.update({
        where: { id: existingCampaign.id },
        data: campaignData
      });
      updated++;
    } else {
      // Create new campaign
      await prisma.campaign.create({
        data: {
          ...campaignData,
          accountId: localAccountId,
          facebookCampaignId: fbCampaign.id
        }
      });
      created++;
    }
  }

  return {
    created,
    updated,
    total: facebookData.campaigns.length
  };
}

export default router;