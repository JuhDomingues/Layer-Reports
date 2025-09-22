import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../utils/redis';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
  headers?: boolean; // Include rate limit headers in response
}

export interface FacebookRateLimitConfig extends RateLimitConfig {
  appId?: string; // Facebook App ID for app-level limits
  userLevelLimit?: number; // User-level rate limit
  adAccountLimit?: number; // Ad Account-level rate limit
}

/**
 * Advanced rate limiter with multiple strategies
 */
export class AdvancedRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 60000, // 1 minute default
      maxRequests: 100, // 100 requests per minute default
      keyGenerator: (req) => req.ip,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later',
      headers: true,
      ...config
    };
  }

  /**
   * Create middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.config.keyGenerator!(req);
        const windowKey = `rate_limit:${key}:${Math.floor(Date.now() / this.config.windowMs)}`;

        // Get current count
        const current = await redisClient.get(windowKey);
        const count = current ? parseInt(current) : 0;

        // Check if limit exceeded
        if (count >= this.config.maxRequests) {
          // Add rate limit headers
          if (this.config.headers) {
            res.set({
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (Math.ceil(Date.now() / this.config.windowMs) * this.config.windowMs).toString()
            });
          }

          logger.warn('Rate limit exceeded', {
            key,
            count,
            limit: this.config.maxRequests,
            window: this.config.windowMs,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
          });

          throw new AppError(this.config.message!, 429, 'RATE_LIMIT_EXCEEDED');
        }

        // Increment counter
        const newCount = await redisClient.incr(windowKey);
        
        // Set expiration on first request
        if (newCount === 1) {
          await redisClient.expire(windowKey, Math.ceil(this.config.windowMs / 1000));
        }

        // Add rate limit headers
        if (this.config.headers) {
          const remaining = Math.max(0, this.config.maxRequests - newCount);
          const resetTime = Math.ceil(Date.now() / this.config.windowMs) * this.config.windowMs;

          res.set({
            'X-RateLimit-Limit': this.config.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetTime.toString()
          });
        }

        // Track response to potentially skip counting
        const originalSend = res.send;
        res.send = function(body) {
          const statusCode = res.statusCode;
          
          // Log rate limit usage
          logger.debug('Rate limit check passed', {
            key,
            count: newCount,
            limit: this.config.maxRequests,
            remaining: Math.max(0, this.config.maxRequests - newCount),
            statusCode
          });

          return originalSend.call(this, body);
        }.bind(this);

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

/**
 * Facebook API specific rate limiter
 */
export class FacebookRateLimiter extends AdvancedRateLimiter {
  private facebookConfig: FacebookRateLimitConfig;

  constructor(config: FacebookRateLimitConfig) {
    super(config);
    this.facebookConfig = config;
  }

  /**
   * Create Facebook-specific middleware
   */
  facebookMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await Promise.all([
          this.checkAppLevelLimit(req),
          this.checkUserLevelLimit(req),
          this.checkAdAccountLimit(req)
        ]);

        // Call parent middleware
        return this.middleware()(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Check app-level rate limits
   */
  private async checkAppLevelLimit(req: Request): Promise<void> {
    if (!this.facebookConfig.appId) return;

    const appKey = `fb_app_limit:${this.facebookConfig.appId}`;
    const windowKey = `${appKey}:${Math.floor(Date.now() / this.config.windowMs)}`;
    
    const count = await redisClient.get(windowKey);
    const currentCount = count ? parseInt(count) : 0;

    // Facebook app-level limit (typically 200 calls per hour per app)
    const appLimit = 200;
    
    if (currentCount >= appLimit) {
      throw new AppError('App-level rate limit exceeded', 429, 'FB_APP_RATE_LIMIT');
    }

    await redisClient.incr(windowKey);
    await redisClient.expire(windowKey, Math.ceil(this.config.windowMs / 1000));
  }

  /**
   * Check user-level rate limits
   */
  private async checkUserLevelLimit(req: Request): Promise<void> {
    const userId = (req as any).user?.id;
    if (!userId || !this.facebookConfig.userLevelLimit) return;

    const userKey = `fb_user_limit:${userId}`;
    const windowKey = `${userKey}:${Math.floor(Date.now() / this.config.windowMs)}`;
    
    const count = await redisClient.get(windowKey);
    const currentCount = count ? parseInt(count) : 0;

    if (currentCount >= this.facebookConfig.userLevelLimit) {
      throw new AppError('User-level rate limit exceeded', 429, 'FB_USER_RATE_LIMIT');
    }

    await redisClient.incr(windowKey);
    await redisClient.expire(windowKey, Math.ceil(this.config.windowMs / 1000));
  }

  /**
   * Check ad account-level rate limits
   */
  private async checkAdAccountLimit(req: Request): Promise<void> {
    const accountId = req.params.accountId;
    if (!accountId || !this.facebookConfig.adAccountLimit) return;

    const accountKey = `fb_account_limit:${accountId}`;
    const windowKey = `${accountKey}:${Math.floor(Date.now() / this.config.windowMs)}`;
    
    const count = await redisClient.get(windowKey);
    const currentCount = count ? parseInt(count) : 0;

    if (currentCount >= this.facebookConfig.adAccountLimit) {
      throw new AppError('Ad account-level rate limit exceeded', 429, 'FB_ACCOUNT_RATE_LIMIT');
    }

    await redisClient.incr(windowKey);
    await redisClient.expire(windowKey, Math.ceil(this.config.windowMs / 1000));
  }
}

/**
 * Adaptive rate limiter that adjusts based on system load
 */
export class AdaptiveRateLimiter extends AdvancedRateLimiter {
  private baseLimit: number;
  private loadThresholds: { cpu: number; memory: number; errorRate: number };

  constructor(config: RateLimitConfig & {
    baseLimit: number;
    loadThresholds?: { cpu: number; memory: number; errorRate: number };
  }) {
    super(config);
    this.baseLimit = config.baseLimit;
    this.loadThresholds = config.loadThresholds || {
      cpu: 80, // 80% CPU usage
      memory: 80, // 80% memory usage
      errorRate: 5 // 5% error rate
    };
  }

  /**
   * Create adaptive middleware
   */
  adaptiveMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get current system metrics
        const metrics = await this.getSystemMetrics();
        
        // Adjust rate limit based on system load
        const adjustedLimit = this.calculateAdjustedLimit(metrics);
        
        // Temporarily update config
        const originalLimit = this.config.maxRequests;
        this.config.maxRequests = adjustedLimit;

        // Log adjustment if significant
        if (Math.abs(adjustedLimit - this.baseLimit) / this.baseLimit > 0.1) {
          logger.info('Rate limit adjusted', {
            baseLimit: this.baseLimit,
            adjustedLimit,
            metrics,
            adjustment: ((adjustedLimit - this.baseLimit) / this.baseLimit * 100).toFixed(1) + '%'
          });
        }

        // Call parent middleware
        await this.middleware()(req, res, (error) => {
          // Restore original limit
          this.config.maxRequests = originalLimit;
          next(error);
        });
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Get current system metrics
   */
  private async getSystemMetrics(): Promise<{ cpu: number; memory: number; errorRate: number }> {
    // Get metrics from Redis (these would be updated by system monitors)
    const [cpuUsage, memoryUsage, errorRate] = await Promise.all([
      redisClient.get('system:cpu_usage'),
      redisClient.get('system:memory_usage'),
      redisClient.get('system:error_rate')
    ]);

    return {
      cpu: cpuUsage ? parseFloat(cpuUsage) : 0,
      memory: memoryUsage ? parseFloat(memoryUsage) : 0,
      errorRate: errorRate ? parseFloat(errorRate) : 0
    };
  }

  /**
   * Calculate adjusted rate limit based on system metrics
   */
  private calculateAdjustedLimit(metrics: { cpu: number; memory: number; errorRate: number }): number {
    let adjustmentFactor = 1.0;

    // Reduce limit if CPU usage is high
    if (metrics.cpu > this.loadThresholds.cpu) {
      adjustmentFactor *= 0.7; // Reduce by 30%
    }

    // Reduce limit if memory usage is high
    if (metrics.memory > this.loadThresholds.memory) {
      adjustmentFactor *= 0.8; // Reduce by 20%
    }

    // Reduce limit if error rate is high
    if (metrics.errorRate > this.loadThresholds.errorRate) {
      adjustmentFactor *= 0.6; // Reduce by 40%
    }

    // Increase limit if system is performing well
    if (metrics.cpu < 30 && metrics.memory < 50 && metrics.errorRate < 1) {
      adjustmentFactor *= 1.2; // Increase by 20%
    }

    const adjustedLimit = Math.floor(this.baseLimit * adjustmentFactor);
    
    // Ensure minimum limit
    return Math.max(10, adjustedLimit);
  }
}

/**
 * Distributed rate limiter for multiple server instances
 */
export class DistributedRateLimiter extends AdvancedRateLimiter {
  private instanceId: string;

  constructor(config: RateLimitConfig & { instanceId: string }) {
    super(config);
    this.instanceId = config.instanceId;
  }

  /**
   * Create distributed middleware using Redis for coordination
   */
  distributedMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.config.keyGenerator!(req);
        const windowStart = Math.floor(Date.now() / this.config.windowMs);
        
        // Use Redis sorted sets for distributed counting
        const distributedKey = `distributed_rate_limit:${key}:${windowStart}`;
        const requestId = `${this.instanceId}:${Date.now()}:${Math.random()}`;

        // Add this request to the sorted set
        await redisClient.zadd(distributedKey, Date.now(), requestId);
        
        // Set expiration
        await redisClient.expire(distributedKey, Math.ceil(this.config.windowMs / 1000));

        // Count requests in current window
        const windowEnd = windowStart * this.config.windowMs + this.config.windowMs;
        const count = await redisClient.zcount(
          distributedKey,
          windowStart * this.config.windowMs,
          windowEnd
        );

        if (count > this.config.maxRequests) {
          // Remove this request since it exceeds limit
          await redisClient.zrem(distributedKey, requestId);
          
          throw new AppError(this.config.message!, 429, 'DISTRIBUTED_RATE_LIMIT_EXCEEDED');
        }

        // Clean up old entries (optional optimization)
        if (Math.random() < 0.1) { // 10% chance to clean up
          await redisClient.zremrangebyscore(
            distributedKey,
            0,
            windowStart * this.config.windowMs - this.config.windowMs
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

/**
 * Token bucket rate limiter for burst handling
 */
export class TokenBucketRateLimiter {
  private bucketSize: number;
  private refillRate: number; // tokens per second
  private refillInterval: number; // milliseconds

  constructor(bucketSize: number, refillRate: number) {
    this.bucketSize = bucketSize;
    this.refillRate = refillRate;
    this.refillInterval = 1000; // 1 second
  }

  /**
   * Create token bucket middleware
   */
  middleware(keyGenerator: (req: Request) => string = (req) => req.ip) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = keyGenerator(req);
        const bucketKey = `token_bucket:${key}`;
        
        // Get current bucket state
        const bucketData = await redisClient.hmget(bucketKey, 'tokens', 'lastRefill');
        
        let tokens = bucketData[0] ? parseFloat(bucketData[0]) : this.bucketSize;
        let lastRefill = bucketData[1] ? parseInt(bucketData[1]) : Date.now();

        // Calculate tokens to add based on time elapsed
        const now = Date.now();
        const timePassed = (now - lastRefill) / 1000; // seconds
        const tokensToAdd = timePassed * this.refillRate;
        
        tokens = Math.min(this.bucketSize, tokens + tokensToAdd);

        // Check if request can be processed
        if (tokens < 1) {
          // Calculate when next token will be available
          const nextTokenIn = (1 - tokens) / this.refillRate * 1000;
          
          res.set({
            'X-RateLimit-Limit': this.bucketSize.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (now + nextTokenIn).toString()
          });

          throw new AppError('Rate limit exceeded', 429, 'TOKEN_BUCKET_EMPTY');
        }

        // Consume token
        tokens -= 1;

        // Update bucket state
        await redisClient.hmset(bucketKey, 'tokens', tokens.toString(), 'lastRefill', now.toString());
        await redisClient.expire(bucketKey, Math.ceil(this.bucketSize / this.refillRate) + 60);

        // Set response headers
        res.set({
          'X-RateLimit-Limit': this.bucketSize.toString(),
          'X-RateLimit-Remaining': Math.floor(tokens).toString(),
          'X-RateLimit-Reset': (now + (this.bucketSize - tokens) / this.refillRate * 1000).toString()
        });

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // General API rate limiting
  general: new AdvancedRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests, please try again later'
  }),

  // Facebook API specific
  facebook: new FacebookRateLimiter({
    windowMs: 3600000, // 1 hour
    maxRequests: 200,
    userLevelLimit: 100,
    adAccountLimit: 50,
    message: 'Facebook API rate limit exceeded'
  }),

  // Login attempts
  login: new AdvancedRateLimiter({
    windowMs: 900000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => `login:${req.ip}:${req.body?.email || 'unknown'}`,
    message: 'Too many login attempts, please try again later'
  }),

  // Heavy operations (insights, reports)
  heavy: new TokenBucketRateLimiter(10, 0.5), // 10 tokens, 0.5 tokens per second

  // Real-time operations
  realtime: new AdaptiveRateLimiter({
    windowMs: 60000,
    maxRequests: 200,
    baseLimit: 200,
    loadThresholds: { cpu: 70, memory: 75, errorRate: 3 }
  })
};