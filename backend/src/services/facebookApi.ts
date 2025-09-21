import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';
import { AppError } from '../middleware/errorHandler';

export interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  updated_time: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: string;
}

export interface FacebookInsight {
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  spend: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

export interface FacebookAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
}

export class FacebookApiService {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: `${config.FACEBOOK_BASE_URL}/${config.FACEBOOK_GRAPH_API_VERSION}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add access token
    this.client.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        access_token: this.accessToken,
      };
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error.response?.data?.error?.message || error.message;
        const errorCode = error.response?.data?.error?.code || 'FACEBOOK_API_ERROR';
        
        logger.error('Facebook API Error:', {
          message: errorMessage,
          code: errorCode,
          status: error.response?.status,
          url: error.config?.url,
        });

        throw new AppError(
          `Facebook API Error: ${errorMessage}`,
          error.response?.status || 500,
          errorCode
        );
      }
    );
  }

  /**
   * Get user's ad accounts
   */
  async getAdAccounts(): Promise<FacebookAccount[]> {
    const cacheKey = `facebook:accounts:${this.accessToken}`;
    
    try {
      // Try to get from cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached ad accounts');
        return JSON.parse(cached);
      }

      const response: AxiosResponse = await this.client.get('/me/adaccounts', {
        params: {
          fields: 'id,name,account_status,currency,timezone_name',
          limit: 100
        }
      });

      const accounts = response.data.data as FacebookAccount[];
      
      // Cache for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(accounts), 3600);
      
      return accounts;
    } catch (error) {
      logger.error('Error fetching ad accounts:', error);
      throw error;
    }
  }

  /**
   * Get campaigns for a specific ad account
   */
  async getCampaigns(
    accountId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ campaigns: FacebookCampaign[]; paging?: any }> {
    const cacheKey = `facebook:campaigns:${accountId}:${status || 'all'}:${limit}:${offset}`;
    
    try {
      // Try to get from cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached campaigns');
        return JSON.parse(cached);
      }

      const params: any = {
        fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,bid_strategy',
        limit,
        offset,
      };

      // Add status filter if provided
      if (status && status !== 'all') {
        params.filtering = JSON.stringify([{
          field: 'status',
          operator: 'EQUAL',
          value: status.toUpperCase()
        }]);
      }

      const response: AxiosResponse = await this.client.get(`/${accountId}/campaigns`, {
        params
      });

      const result = {
        campaigns: response.data.data as FacebookCampaign[],
        paging: response.data.paging
      };
      
      // Cache for 5 minutes
      await redisClient.set(cacheKey, JSON.stringify(result), config.FACEBOOK_CACHE_TTL);
      
      return result;
    } catch (error) {
      logger.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Get insights for a campaign or account
   */
  async getInsights(
    objectId: string,
    startDate: string,
    endDate: string,
    metrics?: string[],
    level: 'account' | 'campaign' = 'campaign'
  ): Promise<FacebookInsight[]> {
    const defaultMetrics = [
      'impressions',
      'clicks',
      'spend',
      'ctr',
      'cpc',
      'cpm',
      'actions'
    ];

    const metricsToFetch = metrics && metrics.length > 0 ? metrics : defaultMetrics;
    const cacheKey = `facebook:insights:${objectId}:${startDate}:${endDate}:${metricsToFetch.join(',')}`;
    
    try {
      // Try to get from cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached insights');
        return JSON.parse(cached);
      }

      const params = {
        fields: metricsToFetch.join(','),
        time_range: JSON.stringify({
          since: startDate,
          until: endDate
        }),
        time_increment: 1, // Daily breakdown
        level: level,
        limit: 1000
      };

      const response: AxiosResponse = await this.client.get(`/${objectId}/insights`, {
        params
      });

      const insights = response.data.data as FacebookInsight[];
      
      // Cache for 10 minutes
      await redisClient.set(cacheKey, JSON.stringify(insights), 600);
      
      return insights;
    } catch (error) {
      logger.error('Error fetching insights:', error);
      throw error;
    }
  }

  /**
   * Get campaign insights with aggregated data
   */
  async getCampaignInsights(
    campaignId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalInsights: any;
    dailyInsights: FacebookInsight[];
  }> {
    try {
      const insights = await this.getInsights(campaignId, startDate, endDate);
      
      // Calculate totals
      const totalInsights = insights.reduce((acc, insight) => {
        acc.impressions += parseInt(insight.impressions || '0');
        acc.clicks += parseInt(insight.clicks || '0');
        acc.spend += parseFloat(insight.spend || '0');
        return acc;
      }, { impressions: 0, clicks: 0, spend: 0 });

      // Calculate derived metrics
      const derivedMetrics = {
        ctr: totalInsights.impressions > 0 
          ? (totalInsights.clicks / totalInsights.impressions * 100)
          : 0,
        cpc: totalInsights.clicks > 0 
          ? (totalInsights.spend / totalInsights.clicks)
          : 0,
        cpm: totalInsights.impressions > 0 
          ? (totalInsights.spend / totalInsights.impressions * 1000)
          : 0
      };

      return {
        totalInsights: { ...totalInsights, ...derivedMetrics },
        dailyInsights: insights
      };
    } catch (error) {
      logger.error('Error fetching campaign insights:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(): Promise<{ isValid: boolean; user?: any }> {
    try {
      const response: AxiosResponse = await this.client.get('/me', {
        params: {
          fields: 'id,name,email'
        }
      });

      return {
        isValid: true,
        user: response.data
      };
    } catch (error) {
      logger.warn('Access token validation failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Get account permissions
   */
  async getAccountPermissions(accountId: string): Promise<string[]> {
    try {
      const response: AxiosResponse = await this.client.get(`/${accountId}`, {
        params: {
          fields: 'account_id,permissions'
        }
      });

      return response.data.permissions || [];
    } catch (error) {
      logger.error('Error fetching account permissions:', error);
      return [];
    }
  }
}