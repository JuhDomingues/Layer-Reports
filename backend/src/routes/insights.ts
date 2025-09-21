import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { requireAuth, requireFacebookToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  validateAccountId, 
  validateCampaignId, 
  validateInsightsQuery 
} from '../middleware/validation';
import { FacebookApiService } from '../services/facebookApi';

const router = express.Router();

/**
 * Get account-level insights
 */
router.get('/account/:accountId', requireAuth, requireFacebookToken, 
  validateAccountId, validateInsightsQuery,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;
    const { startDate, endDate, metrics } = req.query;

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

    // Get insights from Facebook API
    const facebookApi = new FacebookApiService(user.facebookAccessToken);
    const insights = await facebookApi.getInsights(
      accountId,
      startDate as string,
      endDate as string,
      metrics ? (metrics as string).split(',') : undefined,
      'account'
    );

    // Calculate aggregated metrics
    const aggregated = insights.reduce((acc, insight) => {
      acc.impressions += parseInt(insight.impressions || '0');
      acc.clicks += parseInt(insight.clicks || '0');
      acc.spend += parseFloat(insight.spend || '0');
      
      // Count conversions from actions
      if (insight.actions) {
        insight.actions.forEach(action => {
          if (action.action_type.includes('conversion') || action.action_type.includes('purchase')) {
            acc.conversions += parseInt(action.value || '0');
          }
        });
      }
      
      return acc;
    }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 });

    // Calculate derived metrics
    const derivedMetrics = {
      ctr: aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions * 100) : 0,
      cpc: aggregated.clicks > 0 ? (aggregated.spend / aggregated.clicks) : 0,
      cpm: aggregated.impressions > 0 ? (aggregated.spend / aggregated.impressions * 1000) : 0,
      conversionRate: aggregated.clicks > 0 ? (aggregated.conversions / aggregated.clicks * 100) : 0,
      costPerConversion: aggregated.conversions > 0 ? (aggregated.spend / aggregated.conversions) : 0
    };

    res.json({
      accountId,
      dateRange: { startDate, endDate },
      aggregated: { ...aggregated, ...derivedMetrics },
      daily: insights,
      meta: {
        totalDays: insights.length,
        dataPoints: insights.length
      }
    });
  })
);

/**
 * Get campaign-level insights
 */
router.get('/campaign/:accountId/:campaignId', requireAuth, requireFacebookToken,
  validateAccountId, validateCampaignId, validateInsightsQuery,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, campaignId } = req.params;
    const { startDate, endDate, metrics, sync = 'false' } = req.query;

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

    const campaign = await prisma.campaign.findFirst({
      where: {
        accountId: account.id,
        facebookCampaignId: campaignId
      }
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new AppError('Facebook token not found', 404, 'FACEBOOK_TOKEN_NOT_FOUND');
    }

    // If sync is requested or data is missing, fetch from Facebook
    if (sync === 'true') {
      await syncCampaignInsights(
        campaignId,
        campaign.id,
        user.facebookAccessToken,
        startDate as string,
        endDate as string
      );
    }

    // Get insights from database
    const insights = await prisma.campaignInsight.findMany({
      where: {
        campaignId: campaign.id,
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      orderBy: { date: 'asc' }
    });

    // If no local data, fetch from Facebook
    if (insights.length === 0) {
      await syncCampaignInsights(
        campaignId,
        campaign.id,
        user.facebookAccessToken,
        startDate as string,
        endDate as string
      );

      // Fetch again after sync
      const newInsights = await prisma.campaignInsight.findMany({
        where: {
          campaignId: campaign.id,
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        },
        orderBy: { date: 'asc' }
      });

      return res.json({
        campaignId,
        campaignName: campaign.name,
        dateRange: { startDate, endDate },
        insights: newInsights,
        aggregated: calculateAggregatedInsights(newInsights),
        meta: {
          totalDays: newInsights.length,
          dataSource: 'facebook_api'
        }
      });
    }

    res.json({
      campaignId,
      campaignName: campaign.name,
      dateRange: { startDate, endDate },
      insights,
      aggregated: calculateAggregatedInsights(insights),
      meta: {
        totalDays: insights.length,
        dataSource: 'database'
      }
    });
  })
);

/**
 * Get insights for multiple campaigns
 */
router.post('/campaigns/batch', requireAuth, requireFacebookToken, validateInsightsQuery,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, campaignIds, startDate, endDate } = req.body;

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      throw new AppError('Campaign IDs are required', 400, 'MISSING_CAMPAIGN_IDS');
    }

    if (campaignIds.length > 50) {
      throw new AppError('Maximum 50 campaigns allowed per request', 400, 'TOO_MANY_CAMPAIGNS');
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

    // Get campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        accountId: account.id,
        facebookCampaignId: { in: campaignIds }
      },
      include: {
        insights: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    const results = campaigns.map(campaign => ({
      campaignId: campaign.facebookCampaignId,
      campaignName: campaign.name,
      insights: campaign.insights,
      aggregated: calculateAggregatedInsights(campaign.insights)
    }));

    res.json({
      accountId,
      dateRange: { startDate, endDate },
      campaigns: results,
      meta: {
        totalCampaigns: results.length,
        requestedCampaigns: campaignIds.length
      }
    });
  })
);

/**
 * Sync insights for a specific campaign
 */
router.post('/campaign/:accountId/:campaignId/sync', requireAuth, requireFacebookToken,
  validateAccountId, validateCampaignId, validateInsightsQuery,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, campaignId } = req.params;
    const { startDate, endDate } = req.body;

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

    const campaign = await prisma.campaign.findFirst({
      where: {
        accountId: account.id,
        facebookCampaignId: campaignId
      }
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new AppError('Facebook token not found', 404, 'FACEBOOK_TOKEN_NOT_FOUND');
    }

    // Perform sync
    const syncResult = await syncCampaignInsights(
      campaignId,
      campaign.id,
      user.facebookAccessToken,
      startDate,
      endDate
    );

    logger.info('Campaign insights sync completed', {
      userId: req.user!.id,
      accountId,
      campaignId,
      ...syncResult
    });

    res.json({
      message: 'Campaign insights synced successfully',
      ...syncResult
    });
  })
);

/**
 * Helper function to sync campaign insights
 */
async function syncCampaignInsights(
  facebookCampaignId: string,
  localCampaignId: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<{ created: number; updated: number; total: number }> {
  const facebookApi = new FacebookApiService(accessToken);
  
  // Fetch insights from Facebook
  const insights = await facebookApi.getInsights(
    facebookCampaignId,
    startDate,
    endDate
  );

  let created = 0;
  let updated = 0;

  // Process each insight
  for (const insight of insights) {
    const date = new Date(insight.date_start);
    
    // Calculate conversions from actions
    let conversions = 0;
    if (insight.actions) {
      conversions = insight.actions
        .filter(action => 
          action.action_type.includes('conversion') || 
          action.action_type.includes('purchase')
        )
        .reduce((sum, action) => sum + parseInt(action.value || '0'), 0);
    }

    const insightData = {
      impressions: parseInt(insight.impressions || '0'),
      clicks: parseInt(insight.clicks || '0'),
      spend: parseFloat(insight.spend || '0'),
      ctr: parseFloat(insight.ctr || '0'),
      cpc: parseFloat(insight.cpc || '0'),
      cpm: parseFloat(insight.cpm || '0'),
      conversions,
      conversionRate: parseInt(insight.clicks || '0') > 0 
        ? (conversions / parseInt(insight.clicks || '0') * 100) 
        : 0,
      costPerConversion: conversions > 0 
        ? (parseFloat(insight.spend || '0') / conversions) 
        : 0,
      updatedAt: new Date()
    };

    // Check if insight already exists
    const existingInsight = await prisma.campaignInsight.findUnique({
      where: {
        campaignId_date: {
          campaignId: localCampaignId,
          date
        }
      }
    });

    if (existingInsight) {
      // Update existing insight
      await prisma.campaignInsight.update({
        where: { id: existingInsight.id },
        data: insightData
      });
      updated++;
    } else {
      // Create new insight
      await prisma.campaignInsight.create({
        data: {
          ...insightData,
          campaignId: localCampaignId,
          date
        }
      });
      created++;
    }
  }

  return {
    created,
    updated,
    total: insights.length
  };
}

/**
 * Helper function to calculate aggregated insights
 */
function calculateAggregatedInsights(insights: any[]) {
  const totals = insights.reduce((acc, insight) => {
    acc.impressions += insight.impressions || 0;
    acc.clicks += insight.clicks || 0;
    acc.spend += insight.spend || 0;
    acc.conversions += insight.conversions || 0;
    return acc;
  }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 });

  return {
    ...totals,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0,
    cpc: totals.clicks > 0 ? (totals.spend / totals.clicks) : 0,
    cpm: totals.impressions > 0 ? (totals.spend / totals.impressions * 1000) : 0,
    conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks * 100) : 0,
    costPerConversion: totals.conversions > 0 ? (totals.spend / totals.conversions) : 0
  };
}

export default router;