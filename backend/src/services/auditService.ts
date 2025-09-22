import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/redis';

export interface AuditLog {
  id?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  metadata: {
    ip: string;
    userAgent: string;
    timestamp: Date;
    sessionId?: string;
    requestId?: string;
  };
  changes?: {
    before: any;
    after: any;
  };
  success: boolean;
  errorMessage?: string;
}

export interface SecurityEvent {
  type: 'LOGIN_FAILED' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ip: string;
  userAgent: string;
  details: any;
  timestamp: Date;
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  userId?: string;
  timestamp: Date;
  memoryUsage?: number;
  dbQueries?: number;
  cacheHits?: number;
}

export class AuditService {
  /**
   * Log user action for audit trail
   */
  async logAction(auditLog: Omit<AuditLog, 'id'>): Promise<string> {
    try {
      // Store in database for permanent record
      const record = await prisma.auditLog.create({
        data: {
          userId: auditLog.userId,
          action: auditLog.action,
          resource: auditLog.resource,
          resourceId: auditLog.resourceId,
          details: auditLog.details,
          metadata: auditLog.metadata,
          changes: auditLog.changes,
          success: auditLog.success,
          errorMessage: auditLog.errorMessage,
          timestamp: auditLog.metadata.timestamp
        }
      });

      // Also log to application logger for immediate visibility
      logger.info('User action audit', {
        auditId: record.id,
        userId: auditLog.userId,
        action: auditLog.action,
        resource: auditLog.resource,
        success: auditLog.success,
        ip: auditLog.metadata.ip
      });

      // Store recent actions in Redis for quick access
      const recentKey = `audit:recent:${auditLog.userId}`;
      await redisClient.lpush(recentKey, JSON.stringify({
        id: record.id,
        action: auditLog.action,
        resource: auditLog.resource,
        timestamp: auditLog.metadata.timestamp,
        success: auditLog.success
      }));
      
      // Keep only last 50 actions per user
      await redisClient.ltrim(recentKey, 0, 49);
      await redisClient.expire(recentKey, 7 * 24 * 60 * 60); // 7 days

      return record.id;
    } catch (error) {
      logger.error('Failed to log audit action', {
        error: error.message,
        auditLog
      });
      throw error;
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in database
      await prisma.securityEvent.create({
        data: {
          type: event.type,
          severity: event.severity,
          userId: event.userId,
          ip: event.ip,
          userAgent: event.userAgent,
          details: event.details,
          timestamp: event.timestamp
        }
      });

      // Log to application logger with appropriate level
      const logLevel = event.severity === 'CRITICAL' ? 'error' : 
                      event.severity === 'HIGH' ? 'warn' : 'info';
      
      logger[logLevel]('Security event', {
        type: event.type,
        severity: event.severity,
        userId: event.userId,
        ip: event.ip,
        details: event.details
      });

      // Alert on critical events
      if (event.severity === 'CRITICAL') {
        await this.sendSecurityAlert(event);
      }

      // Track suspicious patterns
      await this.trackSuspiciousActivity(event);

    } catch (error) {
      logger.error('Failed to log security event', {
        error: error.message,
        event
      });
    }
  }

  /**
   * Log performance metrics
   */
  async logPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Store in time-series optimized collection
      const metricKey = `perf:${metric.endpoint}:${metric.method}`;
      const timeSlot = Math.floor(Date.now() / (60 * 1000)); // 1-minute slots
      
      // Store in Redis for real-time monitoring
      await Promise.all([
        // Store individual metric
        redisClient.zadd(`${metricKey}:${timeSlot}`, metric.timestamp.getTime(), JSON.stringify(metric)),
        
        // Update aggregates
        redisClient.hincrby(`${metricKey}:stats:${timeSlot}`, 'count', 1),
        redisClient.hincrby(`${metricKey}:stats:${timeSlot}`, 'totalDuration', metric.duration),
        redisClient.hincrby(`${metricKey}:stats:${timeSlot}`, `status_${metric.statusCode}`, 1),
        
        // Set expiration (keep for 24 hours)
        redisClient.expire(`${metricKey}:${timeSlot}`, 24 * 60 * 60),
        redisClient.expire(`${metricKey}:stats:${timeSlot}`, 24 * 60 * 60)
      ]);

      // Alert on performance issues
      if (metric.duration > 5000) { // 5 seconds
        logger.warn('Slow request detected', {
          endpoint: metric.endpoint,
          method: metric.method,
          duration: metric.duration,
          userId: metric.userId,
          statusCode: metric.statusCode
        });
      }

    } catch (error) {
      logger.error('Failed to log performance metric', {
        error: error.message,
        metric
      });
    }
  }

  /**
   * Get audit trail for user
   */
  async getUserAuditTrail(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const {
      limit = 50,
      offset = 0,
      action,
      resource,
      startDate,
      endDate
    } = options;

    const where: any = { userId };

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs: logs as AuditLog[], total };
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    options: {
      severity?: SecurityEvent['severity'];
      type?: SecurityEvent['type'];
      userId?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ events: SecurityEvent[]; total: number }> {
    const {
      severity,
      type,
      userId,
      limit = 50,
      offset = 0,
      startDate,
      endDate
    } = options;

    const where: any = {};

    if (severity) where.severity = severity;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.securityEvent.count({ where })
    ]);

    return { events: events as SecurityEvent[], total };
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(
    endpoint?: string,
    timeRange: { startTime: Date; endTime: Date } = {
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date()
    }
  ): Promise<{
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    statusCodeDistribution: Record<string, number>;
    slowestRequests: PerformanceMetric[];
    timeSeriesData: Array<{
      timestamp: number;
      avgDuration: number;
      requestCount: number;
      errorCount: number;
    }>;
  }> {
    const pattern = endpoint ? `perf:${endpoint}:*:stats:*` : 'perf:*:stats:*';
    const keys = await redisClient.keys(pattern);

    let totalRequests = 0;
    let totalDuration = 0;
    let statusCodeDistribution: Record<string, number> = {};
    const timeSeriesData: Array<{
      timestamp: number;
      avgDuration: number;
      requestCount: number;
      errorCount: number;
    }> = [];

    // Process aggregated stats
    for (const key of keys) {
      const stats = await redisClient.hgetall(key);
      if (!stats || !stats.count) continue;

      const count = parseInt(stats.count);
      const duration = parseInt(stats.totalDuration || '0');
      
      totalRequests += count;
      totalDuration += duration;

      // Extract timestamp from key
      const timeSlot = parseInt(key.split(':').pop() || '0');
      const timestamp = timeSlot * 60 * 1000;

      // Count status codes
      Object.keys(stats).forEach(statKey => {
        if (statKey.startsWith('status_')) {
          const statusCode = statKey.replace('status_', '');
          statusCodeDistribution[statusCode] = (statusCodeDistribution[statusCode] || 0) + parseInt(stats[statKey]);
        }
      });

      // Add to time series
      const errorCount = Object.keys(stats)
        .filter(k => k.startsWith('status_') && !k.match(/status_[23]/))
        .reduce((sum, k) => sum + parseInt(stats[k]), 0);

      timeSeriesData.push({
        timestamp,
        avgDuration: count > 0 ? duration / count : 0,
        requestCount: count,
        errorCount
      });
    }

    // Sort time series data
    timeSeriesData.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate error rate
    const errorCount = Object.keys(statusCodeDistribution)
      .filter(code => !code.match(/^[23]/))
      .reduce((sum, code) => sum + statusCodeDistribution[code], 0);
    
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Get slowest requests (this would require more detailed storage in production)
    const slowestRequests: PerformanceMetric[] = [];

    return {
      averageResponseTime: totalRequests > 0 ? totalDuration / totalRequests : 0,
      totalRequests,
      errorRate,
      statusCodeDistribution,
      slowestRequests,
      timeSeriesData
    };
  }

  /**
   * Track Facebook API usage for billing and optimization
   */
  async trackFacebookApiUsage(
    userId: string,
    endpoint: string,
    requestCost: number,
    responseSize: number,
    duration: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `fb_api_usage:${userId}:${today}`;

    await Promise.all([
      // Daily usage tracking
      redisClient.hincrby(usageKey, 'requests', 1),
      redisClient.hincrby(usageKey, 'cost', requestCost),
      redisClient.hincrby(usageKey, 'responseSize', responseSize),
      redisClient.hincrby(usageKey, 'totalDuration', duration),
      redisClient.expire(usageKey, 32 * 24 * 60 * 60), // Keep for 32 days

      // Endpoint-specific tracking
      redisClient.hincrby(`${usageKey}:endpoints`, endpoint, 1)
    ]);

    // Log to audit trail
    await this.logAction({
      userId,
      action: 'FACEBOOK_API_CALL',
      resource: 'facebook_api',
      resourceId: endpoint,
      details: {
        endpoint,
        requestCost,
        responseSize,
        duration
      },
      metadata: {
        ip: 'system',
        userAgent: 'api_tracker',
        timestamp: new Date()
      },
      success: true
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number;
    userActivitySummary: Record<string, number>;
    securityEventsSummary: Record<string, number>;
    dataAccessLog: AuditLog[];
    failedOperations: AuditLog[];
  }> {
    const [
      totalActions,
      userActivity,
      securityEvents,
      dataAccess,
      failedOps
    ] = await Promise.all([
      // Total actions count
      prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate }
        }
      }),

      // User activity summary
      prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          timestamp: { gte: startDate, lte: endDate }
        },
        _count: { action: true }
      }),

      // Security events summary
      prisma.securityEvent.groupBy({
        by: ['type'],
        where: {
          timestamp: { gte: startDate, lte: endDate }
        },
        _count: { type: true }
      }),

      // Data access logs
      prisma.auditLog.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          resource: { in: ['campaign', 'insight', 'account'] }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000
      }),

      // Failed operations
      prisma.auditLog.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          success: false
        },
        orderBy: { timestamp: 'desc' },
        take: 500
      })
    ]);

    const userActivitySummary = userActivity.reduce((acc, item) => {
      acc[item.action] = item._count.action;
      return acc;
    }, {} as Record<string, number>);

    const securityEventsSummary = securityEvents.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions,
      userActivitySummary,
      securityEventsSummary,
      dataAccessLog: dataAccess as AuditLog[],
      failedOperations: failedOps as AuditLog[]
    };
  }

  /**
   * Private helper methods
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, this would send alerts via email, Slack, etc.
    logger.error('CRITICAL SECURITY EVENT', {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      details: event.details
    });
  }

  private async trackSuspiciousActivity(event: SecurityEvent): Promise<void> {
    // Track patterns for potential security threats
    const patternKey = `suspicious:${event.ip}:${event.type}`;
    const count = await redisClient.incr(patternKey);
    await redisClient.expire(patternKey, 60 * 60); // 1 hour window

    // Alert if pattern threshold exceeded
    if (count > 5) {
      await this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        ip: event.ip,
        userAgent: event.userAgent,
        details: {
          pattern: event.type,
          occurrences: count,
          timeWindow: '1 hour'
        },
        timestamp: new Date()
      });
    }
  }
}

// Singleton instance
export const auditService = new AuditService();