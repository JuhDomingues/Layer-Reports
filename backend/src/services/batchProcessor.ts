import { FacebookApiService } from './facebookApi';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';

export interface BatchJob {
  id: string;
  type: 'CAMPAIGN_INSIGHTS' | 'ACCOUNT_INSIGHTS' | 'CAMPAIGN_SYNC';
  entityIds: string[];
  parameters: any;
  userId: string;
  accountId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: any;
  errors?: string[];
}

export interface BatchInsightsParameters {
  startDate: string;
  endDate: string;
  metrics?: string[];
  breakdown?: string[];
}

export class BatchProcessor {
  private processingJobs = new Set<string>();
  private maxConcurrentJobs = 3;
  private maxBatchSize = 50;

  /**
   * Queue batch insights job
   */
  async queueBatchInsights(
    type: 'CAMPAIGN_INSIGHTS' | 'ACCOUNT_INSIGHTS',
    entityIds: string[],
    parameters: BatchInsightsParameters,
    userId: string,
    accountId: string
  ): Promise<string> {
    // Validate batch size
    if (entityIds.length > this.maxBatchSize) {
      throw new Error(`Batch size cannot exceed ${this.maxBatchSize} entities`);
    }

    // Create job ID
    const jobId = `batch_${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store job in Redis
    const job: BatchJob = {
      id: jobId,
      type,
      entityIds,
      parameters,
      userId,
      accountId,
      status: 'PENDING',
      createdAt: new Date(),
      errors: []
    };

    await redisClient.set(
      `batch_job:${jobId}`,
      JSON.stringify(job),
      7 * 24 * 60 * 60 // 7 days TTL
    );

    // Add to processing queue
    await redisClient.lpush('batch_queue', jobId);

    logger.info('Batch job queued', {
      jobId,
      type,
      entityCount: entityIds.length,
      userId,
      accountId
    });

    // Start processing if not at capacity
    this.processNextJob();

    return jobId;
  }

  /**
   * Process next job in queue
   */
  private async processNextJob(): Promise<void> {
    if (this.processingJobs.size >= this.maxConcurrentJobs) {
      logger.debug('Max concurrent jobs reached, waiting');
      return;
    }

    const jobId = await redisClient.rpop('batch_queue');
    if (!jobId) {
      return; // No jobs in queue
    }

    this.processingJobs.add(jobId);

    try {
      await this.processJob(jobId);
    } catch (error) {
      logger.error('Error processing batch job', { jobId, error });
    } finally {
      this.processingJobs.delete(jobId);
      // Process next job
      setTimeout(() => this.processNextJob(), 100);
    }
  }

  /**
   * Process a specific job
   */
  private async processJob(jobId: string): Promise<void> {
    const jobData = await redisClient.get(`batch_job:${jobId}`);
    if (!jobData) {
      logger.warn('Job not found', { jobId });
      return;
    }

    const job: BatchJob = JSON.parse(jobData);
    
    // Update job status
    job.status = 'RUNNING';
    job.startedAt = new Date();
    await this.updateJob(job);

    logger.info('Processing batch job', {
      jobId: job.id,
      type: job.type,
      entityCount: job.entityIds.length
    });

    try {
      let results: any = {};

      switch (job.type) {
        case 'CAMPAIGN_INSIGHTS':
          results = await this.processCampaignInsights(job);
          break;
        case 'ACCOUNT_INSIGHTS':
          results = await this.processAccountInsights(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Update job with results
      job.status = 'COMPLETED';
      job.completedAt = new Date();
      job.results = results;
      await this.updateJob(job);

      logger.info('Batch job completed successfully', {
        jobId: job.id,
        type: job.type,
        duration: job.completedAt.getTime() - job.startedAt!.getTime(),
        processedEntities: Object.keys(results).length
      });

    } catch (error) {
      job.status = 'FAILED';
      job.completedAt = new Date();
      job.errors = job.errors || [];
      job.errors.push(error.message);
      await this.updateJob(job);

      logger.error('Batch job failed', {
        jobId: job.id,
        type: job.type,
        error: error.message
      });
    }
  }

  /**
   * Process campaign insights batch
   */
  private async processCampaignInsights(job: BatchJob): Promise<any> {
    const { parameters, userId, accountId } = job;
    const { startDate, endDate, metrics } = parameters as BatchInsightsParameters;

    // Get user's Facebook token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new Error('Facebook token not found');
    }

    const facebookApi = new FacebookApiService(user.facebookAccessToken);
    const results: any = {};
    const errors: string[] = [];

    // Process entities in smaller chunks to respect rate limits
    const chunkSize = 10;
    const chunks = this.chunkArray(job.entityIds, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      logger.debug('Processing chunk', {
        jobId: job.id,
        chunkIndex: i + 1,
        totalChunks: chunks.length,
        chunkSize: chunk.length
      });

      // Process chunk entities in parallel with controlled concurrency
      const chunkPromises = chunk.map(async (campaignId) => {
        try {
          const insights = await facebookApi.getCampaignInsights(
            campaignId,
            startDate,
            endDate
          );

          results[campaignId] = insights;

          // Store insights in database
          await this.storeCampaignInsights(campaignId, insights, accountId);

        } catch (error) {
          const errorMsg = `Campaign ${campaignId}: ${error.message}`;
          errors.push(errorMsg);
          logger.warn('Failed to process campaign insights', {
            jobId: job.id,
            campaignId,
            error: error.message
          });
        }
      });

      await Promise.all(chunkPromises);

      // Rate limiting: wait between chunks
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update job progress
      const progress = Math.round(((i + 1) / chunks.length) * 100);
      job.results = { 
        ...results, 
        progress,
        processedChunks: i + 1,
        totalChunks: chunks.length,
        errors
      };
      await this.updateJob(job);
    }

    return {
      success: true,
      processedCampaigns: Object.keys(results).length,
      totalRequested: job.entityIds.length,
      errors,
      data: results
    };
  }

  /**
   * Process account insights batch
   */
  private async processAccountInsights(job: BatchJob): Promise<any> {
    const { parameters, userId } = job;
    const { startDate, endDate, metrics } = parameters as BatchInsightsParameters;

    // Get user's Facebook token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new Error('Facebook token not found');
    }

    const facebookApi = new FacebookApiService(user.facebookAccessToken);
    const results: any = {};

    // Process each account
    for (const accountId of job.entityIds) {
      try {
        const insights = await facebookApi.getInsights(
          accountId,
          startDate,
          endDate,
          metrics,
          'account'
        );

        results[accountId] = insights;

      } catch (error) {
        logger.warn('Failed to process account insights', {
          jobId: job.id,
          accountId,
          error: error.message
        });
      }

      // Rate limiting between accounts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      success: true,
      processedAccounts: Object.keys(results).length,
      totalRequested: job.entityIds.length,
      data: results
    };
  }

  /**
   * Store campaign insights in database
   */
  private async storeCampaignInsights(
    facebookCampaignId: string,
    insights: any,
    accountId: string
  ): Promise<void> {
    // Find local campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        facebookCampaignId,
        account: { facebookAccountId: accountId }
      }
    });

    if (!campaign) {
      logger.warn('Campaign not found for insights storage', { facebookCampaignId });
      return;
    }

    // Store daily insights
    for (const dailyInsight of insights.dailyInsights) {
      const date = new Date(dailyInsight.date_start);

      const insightData = {
        impressions: parseInt(dailyInsight.impressions || '0'),
        clicks: parseInt(dailyInsight.clicks || '0'),
        spend: parseFloat(dailyInsight.spend || '0'),
        ctr: parseFloat(dailyInsight.ctr || '0'),
        cpc: parseFloat(dailyInsight.cpc || '0'),
        cpm: parseFloat(dailyInsight.cpm || '0'),
        conversions: this.extractConversions(dailyInsight.actions),
        updatedAt: new Date()
      };

      // Upsert insight
      await prisma.campaignInsight.upsert({
        where: {
          campaignId_date: {
            campaignId: campaign.id,
            date
          }
        },
        update: insightData,
        create: {
          ...insightData,
          campaignId: campaign.id,
          date
        }
      });
    }
  }

  /**
   * Extract conversions from Facebook actions
   */
  private extractConversions(actions: any[]): number {
    if (!actions) return 0;

    return actions
      .filter(action => 
        action.action_type.includes('conversion') || 
        action.action_type.includes('purchase')
      )
      .reduce((sum, action) => sum + parseInt(action.value || '0'), 0);
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Update job in Redis
   */
  private async updateJob(job: BatchJob): Promise<void> {
    await redisClient.set(
      `batch_job:${job.id}`,
      JSON.stringify(job),
      7 * 24 * 60 * 60 // 7 days TTL
    );
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<BatchJob | null> {
    const jobData = await redisClient.get(`batch_job:${jobId}`);
    return jobData ? JSON.parse(jobData) : null;
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId);
    if (!job) return false;

    if (job.status === 'RUNNING') {
      // Can't cancel running jobs immediately, but mark for cancellation
      job.status = 'FAILED';
      job.errors = job.errors || [];
      job.errors.push('Job cancelled by user');
      await this.updateJob(job);
      return true;
    }

    if (job.status === 'PENDING') {
      // Remove from queue and mark as failed
      await redisClient.lrem('batch_queue', 1, jobId);
      job.status = 'FAILED';
      job.errors = job.errors || [];
      job.errors.push('Job cancelled by user');
      await this.updateJob(job);
      return true;
    }

    return false;
  }

  /**
   * Start background processing
   */
  startProcessing(): void {
    // Start processing jobs every 5 seconds
    setInterval(() => {
      this.processNextJob();
    }, 5000);

    logger.info('Batch processor started', {
      maxConcurrentJobs: this.maxConcurrentJobs,
      maxBatchSize: this.maxBatchSize
    });
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor();