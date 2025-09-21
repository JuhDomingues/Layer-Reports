import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { prisma } from '../utils/database';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    facebookId?: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthService {
  /**
   * Generate JWT token
   */
  static generateToken(userId: string, email: string): string {
    const secret = config.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const payload = { userId, email };
    return (jwt as any).sign(payload, secret, { expiresIn: '7d' });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload {
    try {
      const secret = config.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }
      return jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      } else {
        throw new AppError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Create user session
   */
  static async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  /**
   * Validate session
   */
  static async validateSession(token: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { token }
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        // Clean up expired session
        await prisma.session.delete({
          where: { id: session.id }
        });
      }
      return false;
    }

    return true;
  }

  /**
   * Revoke session
   */
  static async revokeSession(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token }
    });
  }

  /**
   * Clean expired sessions
   */
  static async cleanExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }
}

/**
 * Authentication middleware
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('Authorization header required', 401, 'MISSING_AUTH_HEADER');
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      throw new AppError('Access token required', 401, 'MISSING_TOKEN');
    }

    // Verify JWT token
    const payload = AuthService.verifyToken(token);
    
    // Attach user info to request
    req.user = {
      id: payload.userId,
      email: payload.email
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (token) {
        const payload = AuthService.verifyToken(token);
        req.user = {
          id: payload.userId,
          email: payload.email
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
}

/**
 * Facebook access token validation middleware
 */
export async function requireFacebookToken(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    // Get user's Facebook token from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        facebookAccessToken: true,
        facebookTokenExpiry: true,
        facebookId: true
      }
    });

    if (!user?.facebookAccessToken) {
      throw new AppError(
        'Facebook account not connected', 
        403, 
        'FACEBOOK_NOT_CONNECTED'
      );
    }

    // Check if token is expired
    if (user.facebookTokenExpiry && user.facebookTokenExpiry < new Date()) {
      throw new AppError(
        'Facebook token expired, please reconnect', 
        403, 
        'FACEBOOK_TOKEN_EXPIRED'
      );
    }

    // Add Facebook info to request
    req.user.facebookId = user.facebookId || undefined;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Admin role middleware (future use)
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // This can be expanded when user roles are implemented
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }
  
  // For now, all authenticated users have access
  // In the future, check user.role === 'admin'
  next();
}

/**
 * Rate limiting per user
 */
export function createUserRateLimit(windowMs: number, maxRequests: number) {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userStats = userRequestCounts.get(userId);

    // Reset counter if window has passed
    if (!userStats || now > userStats.resetTime) {
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    // Check if user has exceeded limit
    if (userStats.count >= maxRequests) {
      const resetIn = Math.ceil((userStats.resetTime - now) / 1000);
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': userStats.resetTime.toString(),
        'Retry-After': resetIn.toString()
      });

      throw new AppError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Increment counter
    userStats.count++;
    userRequestCounts.set(userId, userStats);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - userStats.count).toString(),
      'X-RateLimit-Reset': userStats.resetTime.toString()
    });

    next();
  };
}