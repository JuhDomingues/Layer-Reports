import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';

export interface AdvancedMetrics {
  // Performance Metrics
  roas: number; // Return on Ad Spend
  frequency: number; // Average impressions per person
  reach: number; // Unique people reached
  costPerResult: number; // Cost per conversion/result
  
  // Efficiency Metrics
  cpm: number; // Cost per 1000 impressions
  cpc: number; // Cost per click
  ctr: number; // Click-through rate
  cvr: number; // Conversion rate
  
  // Trend Analysis
  performanceTrend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  
  // Budget Metrics
  budgetUtilization: number; // Percentage of budget used
  dailySpendTrend: number[]; // Last 7 days spend
  projectedMonthlySpend: number;
  
  // Quality Metrics
  qualityScore: number; // Composite quality score (1-10)
  adRelevanceScore: number;
  landingPageExperience: number;
  expectedCtr: number;
}

export interface KPIComparison {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: AdvancedMetrics;
  kpiComparisons: {
    spend: KPIComparison;
    conversions: KPIComparison;
    roas: KPIComparison;
    ctr: KPIComparison;
    cpc: KPIComparison;
  };
  insights: string[]; // AI-generated insights
  recommendations: string[]; // Optimization recommendations
}

export interface AccountAnalytics {
  accountId: string;
  accountName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  overview: {
    totalSpend: number;
    totalConversions: number;
    averageRoas: number;
    topPerformingCampaigns: Array<{
      campaignId: string;
      name: string;
      roas: number;
      spend: number;
    }>;
    underperformingCampaigns: Array<{
      campaignId: string;
      name: string;
      roas: number;
      spend: number;
    }>;
  };
  trends: {
    spendTrend: number[];
    roasTrend: number[];
    conversionTrend: number[];
    dates: string[];
  };
  benchmarks: {
    industryAverageCtr: number;
    industryAverageCpc: number;
    industryAverageRoas: number;
    performanceVsIndustry: {
      ctr: 'above' | 'below' | 'average';
      cpc: 'above' | 'below' | 'average';
      roas: 'above' | 'below' | 'average';
    };
  };
}

export class AnalyticsService {
  /**
   * Get advanced analytics for a campaign
   */
  async getCampaignAnalytics(
    campaignId: string,
    startDate: string,
    endDate: string,
    comparisonPeriod?: { startDate: string; endDate: string }
  ): Promise<CampaignAnalytics> {
    const cacheKey = `analytics:campaign:${campaignId}:${startDate}:${endDate}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const campaign = await prisma.campaign.findFirst({
      where: { facebookCampaignId: campaignId },
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

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Calculate advanced metrics
    const metrics = this.calculateAdvancedMetrics(campaign.insights);
    
    // Calculate KPI comparisons
    const kpiComparisons = await this.calculateKPIComparisons(
      campaignId,
      startDate,
      endDate,
      comparisonPeriod
    );

    // Generate insights and recommendations
    const insights = this.generateInsights(metrics, kpiComparisons);
    const recommendations = this.generateRecommendations(metrics, kpiComparisons);

    const analytics: CampaignAnalytics = {
      campaignId,
      campaignName: campaign.name,
      period: { startDate, endDate },
      metrics,
      kpiComparisons,
      insights,
      recommendations
    };

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(analytics), 3600);

    return analytics;
  }

  /**
   * Get account-level analytics
   */
  async getAccountAnalytics(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<AccountAnalytics> {
    const cacheKey = `analytics:account:${accountId}:${startDate}:${endDate}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const account = await prisma.account.findFirst({
      where: { facebookAccountId: accountId },
      include: {
        campaigns: {
          include: {
            insights: {
              where: {
                date: {
                  gte: new Date(startDate),
                  lte: new Date(endDate)
                }
              }
            }
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Calculate overview metrics
    const overview = this.calculateAccountOverview(account.campaigns, startDate, endDate);
    
    // Calculate trends
    const trends = this.calculateAccountTrends(account.campaigns, startDate, endDate);
    
    // Get industry benchmarks
    const benchmarks = await this.getIndustryBenchmarks(account.currency);

    const analytics: AccountAnalytics = {
      accountId,
      accountName: account.name,
      period: { startDate, endDate },
      overview,
      trends,
      benchmarks
    };

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(analytics), 3600);

    return analytics;
  }

  /**
   * Calculate advanced metrics from insights
   */
  private calculateAdvancedMetrics(insights: any[]): AdvancedMetrics {
    const totals = insights.reduce((acc, insight) => {
      acc.impressions += insight.impressions || 0;
      acc.clicks += insight.clicks || 0;
      acc.spend += insight.spend || 0;
      acc.conversions += insight.conversions || 0;
      return acc;
    }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 });

    // Calculate basic metrics
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
    const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const costPerResult = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

    // ROAS calculation (assuming conversion value is 10x cost for demo)
    const estimatedRevenue = totals.conversions * (costPerResult * 3); // 3x ROAS assumption
    const roas = totals.spend > 0 ? estimatedRevenue / totals.spend : 0;

    // Calculate performance trend
    const { trend, trendPercentage } = this.calculateTrend(insights);

    // Calculate budget utilization (assuming daily budget from campaign)
    const dailySpendTrend = this.calculateDailySpendTrend(insights);
    const avgDailySpend = dailySpendTrend.reduce((a, b) => a + b, 0) / dailySpendTrend.length;
    const projectedMonthlySpend = avgDailySpend * 30;

    // Quality score calculation (composite of multiple factors)
    const qualityScore = this.calculateQualityScore(ctr, cvr, cpc);

    return {
      roas,
      frequency: totals.impressions > 0 ? totals.impressions / (totals.impressions * 0.7) : 0, // Estimated
      reach: Math.round(totals.impressions * 0.7), // Estimated unique reach
      costPerResult,
      cpm,
      cpc,
      ctr,
      cvr,
      performanceTrend: trend,
      trendPercentage,
      budgetUtilization: 85, // Would be calculated from actual budget
      dailySpendTrend,
      projectedMonthlySpend,
      qualityScore,
      adRelevanceScore: Math.min(10, qualityScore + 1),
      landingPageExperience: Math.min(10, qualityScore + 0.5),
      expectedCtr: ctr * 1.1 // 10% above current for optimization target
    };
  }

  /**
   * Calculate KPI comparisons with previous period
   */
  private async calculateKPIComparisons(
    campaignId: string,
    startDate: string,
    endDate: string,
    comparisonPeriod?: { startDate: string; endDate: string }
  ): Promise<CampaignAnalytics['kpiComparisons']> {
    // If no comparison period provided, use previous period of same length
    if (!comparisonPeriod) {
      const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime();
      const comparisonEndDate = new Date(new Date(startDate).getTime() - 1);
      const comparisonStartDate = new Date(comparisonEndDate.getTime() - periodLength);
      
      comparisonPeriod = {
        startDate: comparisonStartDate.toISOString().split('T')[0],
        endDate: comparisonEndDate.toISOString().split('T')[0]
      };
    }

    // Get current period data
    const currentInsights = await prisma.campaignInsight.findMany({
      where: {
        campaign: { facebookCampaignId: campaignId },
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    // Get comparison period data
    const comparisonInsights = await prisma.campaignInsight.findMany({
      where: {
        campaign: { facebookCampaignId: campaignId },
        date: {
          gte: new Date(comparisonPeriod.startDate),
          lte: new Date(comparisonPeriod.endDate)
        }
      }
    });

    const currentTotals = this.sumInsights(currentInsights);
    const comparisonTotals = this.sumInsights(comparisonInsights);

    return {
      spend: this.createKPIComparison(currentTotals.spend, comparisonTotals.spend),
      conversions: this.createKPIComparison(currentTotals.conversions, comparisonTotals.conversions),
      roas: this.createKPIComparison(
        currentTotals.conversions * 30 / currentTotals.spend,
        comparisonTotals.conversions * 30 / comparisonTotals.spend
      ),
      ctr: this.createKPIComparison(
        (currentTotals.clicks / currentTotals.impressions) * 100,
        (comparisonTotals.clicks / comparisonTotals.impressions) * 100
      ),
      cpc: this.createKPIComparison(
        currentTotals.spend / currentTotals.clicks,
        comparisonTotals.spend / comparisonTotals.clicks
      )
    };
  }

  /**
   * Create KPI comparison object
   */
  private createKPIComparison(current: number, previous: number): KPIComparison {
    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;
    
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (Math.abs(changePercentage) > 5) {
      trend = changePercentage > 0 ? 'up' : 'down';
    }

    return {
      current: isNaN(current) ? 0 : current,
      previous: isNaN(previous) ? 0 : previous,
      change: isNaN(change) ? 0 : change,
      changePercentage: isNaN(changePercentage) ? 0 : changePercentage,
      trend
    };
  }

  /**
   * Calculate account overview metrics
   */
  private calculateAccountOverview(campaigns: any[], startDate: string, endDate: string): AccountAnalytics['overview'] {
    const campaignMetrics = campaigns.map(campaign => {
      const insights = campaign.insights.filter((insight: any) => {
        const date = new Date(insight.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });

      const totals = this.sumInsights(insights);
      const roas = totals.conversions * 30 / totals.spend; // Estimated ROAS

      return {
        campaignId: campaign.facebookCampaignId,
        name: campaign.name,
        roas: isNaN(roas) ? 0 : roas,
        spend: totals.spend,
        conversions: totals.conversions
      };
    });

    const totalSpend = campaignMetrics.reduce((sum, c) => sum + c.spend, 0);
    const totalConversions = campaignMetrics.reduce((sum, c) => sum + c.conversions, 0);
    const averageRoas = campaignMetrics.reduce((sum, c) => sum + c.roas, 0) / campaignMetrics.length;

    // Sort by ROAS for top/underperforming
    const sortedByRoas = [...campaignMetrics].sort((a, b) => b.roas - a.roas);

    return {
      totalSpend,
      totalConversions,
      averageRoas: isNaN(averageRoas) ? 0 : averageRoas,
      topPerformingCampaigns: sortedByRoas.slice(0, 5),
      underperformingCampaigns: sortedByRoas.slice(-3)
    };
  }

  /**
   * Calculate account trends
   */
  private calculateAccountTrends(campaigns: any[], startDate: string, endDate: string): AccountAnalytics['trends'] {
    const dateRange = this.generateDateRange(startDate, endDate);
    
    const trends = dateRange.map(date => {
      const dayInsights = campaigns.flatMap(campaign => 
        campaign.insights.filter((insight: any) => 
          new Date(insight.date).toDateString() === new Date(date).toDateString()
        )
      );

      const dayTotals = this.sumInsights(dayInsights);
      const dayRoas = dayTotals.conversions * 30 / dayTotals.spend;

      return {
        date,
        spend: dayTotals.spend,
        conversions: dayTotals.conversions,
        roas: isNaN(dayRoas) ? 0 : dayRoas
      };
    });

    return {
      spendTrend: trends.map(t => t.spend),
      conversionTrend: trends.map(t => t.conversions),
      roasTrend: trends.map(t => t.roas),
      dates: trends.map(t => t.date)
    };
  }

  /**
   * Generate insights based on metrics
   */
  private generateInsights(metrics: AdvancedMetrics, kpiComparisons: CampaignAnalytics['kpiComparisons']): string[] {
    const insights: string[] = [];

    // Performance insights
    if (metrics.roas > 3) {
      insights.push(`Excellent ROAS of ${metrics.roas.toFixed(2)}x indicates strong campaign performance`);
    } else if (metrics.roas < 1) {
      insights.push(`Low ROAS of ${metrics.roas.toFixed(2)}x suggests campaign needs optimization`);
    }

    // Trend insights
    if (metrics.performanceTrend === 'improving') {
      insights.push(`Campaign showing positive trend with ${metrics.trendPercentage.toFixed(1)}% improvement`);
    } else if (metrics.performanceTrend === 'declining') {
      insights.push(`Campaign performance declining by ${Math.abs(metrics.trendPercentage).toFixed(1)}%`);
    }

    // CTR insights
    if (metrics.ctr > 2) {
      insights.push(`High CTR of ${metrics.ctr.toFixed(2)}% indicates strong ad relevance`);
    } else if (metrics.ctr < 0.5) {
      insights.push(`Low CTR of ${metrics.ctr.toFixed(2)}% suggests ad creative needs improvement`);
    }

    // Budget insights
    if (metrics.budgetUtilization > 95) {
      insights.push('Budget is being fully utilized - consider increasing for more reach');
    } else if (metrics.budgetUtilization < 50) {
      insights.push('Low budget utilization suggests targeting may be too narrow');
    }

    return insights;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: AdvancedMetrics, kpiComparisons: CampaignAnalytics['kpiComparisons']): string[] {
    const recommendations: string[] = [];

    // ROAS recommendations
    if (metrics.roas < 2) {
      recommendations.push('Consider adjusting targeting to focus on higher-value audiences');
      recommendations.push('Review and optimize landing page experience');
    }

    // CTR recommendations
    if (metrics.ctr < 1) {
      recommendations.push('Test new ad creative variations to improve engagement');
      recommendations.push('Refine audience targeting to reach more relevant users');
    }

    // CPC recommendations
    if (kpiComparisons.cpc.trend === 'up' && kpiComparisons.cpc.changePercentage > 20) {
      recommendations.push('CPC increasing significantly - consider adjusting bid strategy');
      recommendations.push('Review auction overlap with competitors');
    }

    // Conversion recommendations
    if (metrics.cvr < 2) {
      recommendations.push('Low conversion rate - optimize landing page and checkout flow');
      recommendations.push('Consider implementing retargeting campaigns');
    }

    // Budget recommendations
    if (metrics.performanceTrend === 'improving' && metrics.roas > 2) {
      recommendations.push('Campaign performing well - consider increasing budget to scale');
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private sumInsights(insights: any[]) {
    return insights.reduce((acc, insight) => {
      acc.impressions += insight.impressions || 0;
      acc.clicks += insight.clicks || 0;
      acc.spend += insight.spend || 0;
      acc.conversions += insight.conversions || 0;
      return acc;
    }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 });
  }

  private calculateTrend(insights: any[]): { trend: 'improving' | 'declining' | 'stable'; trendPercentage: number } {
    if (insights.length < 7) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    const firstHalf = insights.slice(0, Math.floor(insights.length / 2));
    const secondHalf = insights.slice(Math.floor(insights.length / 2));

    const firstHalfAvg = this.sumInsights(firstHalf).spend / firstHalf.length;
    const secondHalfAvg = this.sumInsights(secondHalf).spend / secondHalf.length;

    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (Math.abs(change) < 5) {
      return { trend: 'stable', trendPercentage: change };
    }

    return {
      trend: change > 0 ? 'improving' : 'declining',
      trendPercentage: change
    };
  }

  private calculateDailySpendTrend(insights: any[]): number[] {
    const last7Days = insights.slice(-7);
    return last7Days.map(insight => insight.spend || 0);
  }

  private calculateQualityScore(ctr: number, cvr: number, cpc: number): number {
    // Simplified quality score calculation
    let score = 5; // Base score

    // CTR component
    if (ctr > 2) score += 2;
    else if (ctr > 1) score += 1;
    else if (ctr < 0.5) score -= 2;

    // CVR component
    if (cvr > 3) score += 2;
    else if (cvr > 1.5) score += 1;
    else if (cvr < 0.5) score -= 1;

    // CPC component (lower is better)
    if (cpc < 0.5) score += 1;
    else if (cpc > 2) score -= 1;

    return Math.max(1, Math.min(10, score));
  }

  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private async getIndustryBenchmarks(currency: string): Promise<AccountAnalytics['benchmarks']> {
    // Mock industry benchmarks - in production, these would come from a data source
    const benchmarks = {
      industryAverageCtr: 1.2,
      industryAverageCpc: 1.5,
      industryAverageRoas: 2.8,
      performanceVsIndustry: {
        ctr: 'average' as const,
        cpc: 'average' as const,
        roas: 'average' as const
      }
    };

    return benchmarks;
  }
}