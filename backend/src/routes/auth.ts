import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthService, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { 
  validateLogin, 
  validateRegister, 
  validateFacebookToken 
} from '../middleware/validation';
import { FacebookApiService } from '../services/facebookApi';

const router = express.Router();

/**
 * Register new user
 */
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('User already exists', 409, 'USER_ALREADY_EXISTS');
  }

  // Hash password
  const hashedPassword = await AuthService.hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      // Note: We're not storing password in this schema
      // If you need password auth, add password field to User model
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
    }
  });

  // Generate token
  const token = AuthService.generateToken(user.id, user.email);
  
  // Create session
  await AuthService.createSession(user.id, token);

  logger.info('User registered successfully', { userId: user.id, email: user.email });

  res.status(201).json({
    message: 'User registered successfully',
    user,
    token
  });
}));

/**
 * Login user (for future use if password auth is needed)
 */
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // For now, we'll just create a token without password verification
  // In a full implementation, you'd verify the password here

  // Generate token
  const token = AuthService.generateToken(user.id, user.email);
  
  // Create session
  await AuthService.createSession(user.id, token);

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    token
  });
}));

/**
 * Facebook OAuth callback
 */
router.post('/facebook', validateFacebookToken, asyncHandler(async (req, res) => {
  const { accessToken, userID } = req.body;

  // Validate Facebook token
  const facebookApi = new FacebookApiService(accessToken);
  const validation = await facebookApi.validateAccessToken();

  if (!validation.isValid || !validation.user) {
    throw new AppError('Invalid Facebook token', 401, 'INVALID_FACEBOOK_TOKEN');
  }

  const facebookUser = validation.user;

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { facebookId: facebookUser.id }
  });

  if (!user) {
    // Check if user exists by email
    if (facebookUser.email) {
      user = await prisma.user.findUnique({
        where: { email: facebookUser.email }
      });
    }

    if (user) {
      // Update existing user with Facebook info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          facebookId: facebookUser.id,
          facebookAccessToken: accessToken,
          facebookTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          name: user.name || facebookUser.name
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: facebookUser.email || `${facebookUser.id}@facebook.local`,
          name: facebookUser.name,
          facebookId: facebookUser.id,
          facebookAccessToken: accessToken,
          facebookTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        }
      });
    }
  } else {
    // Update existing Facebook user
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        facebookAccessToken: accessToken,
        facebookTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        name: user.name || facebookUser.name
      }
    });
  }

  // Generate JWT token
  const token = AuthService.generateToken(user.id, user.email);
  
  // Create session
  await AuthService.createSession(user.id, token);

  logger.info('Facebook login successful', { 
    userId: user.id, 
    facebookId: user.facebookId 
  });

  res.json({
    message: 'Facebook authentication successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      facebookId: user.facebookId
    },
    token
  });
}));

/**
 * Get current user profile
 */
router.get('/profile', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      facebookId: true,
      facebookTokenExpiry: true,
      createdAt: true,
      updatedAt: true,
      accounts: {
        select: {
          id: true,
          facebookAccountId: true,
          accountName: true,
          currency: true,
          isActive: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    user: {
      ...user,
      hasFacebookToken: !!user.facebookTokenExpiry && user.facebookTokenExpiry > new Date()
    }
  });
}));

/**
 * Update user profile
 */
router.put('/profile', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { name } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      name: true,
      updatedAt: true
    }
  });

  res.json({
    message: 'Profile updated successfully',
    user
  });
}));

/**
 * Logout user
 */
router.post('/logout', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (token) {
    await AuthService.revokeSession(token);
  }

  logger.info('User logged out successfully', { userId: req.user!.id });

  res.json({ message: 'Logout successful' });
}));

/**
 * Verify token
 */
router.get('/verify', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({
    valid: true,
    user: req.user
  });
}));

/**
 * Refresh Facebook token (for future use)
 */
router.post('/facebook/refresh', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      facebookAccessToken: true,
      facebookTokenExpiry: true
    }
  });

  if (!user?.facebookAccessToken) {
    throw new AppError(
      'No Facebook token found', 
      404, 
      'NO_FACEBOOK_TOKEN'
    );
  }

  // Check if token is still valid
  const facebookApi = new FacebookApiService(user.facebookAccessToken);
  const validation = await facebookApi.validateAccessToken();

  res.json({
    valid: validation.isValid,
    expiresAt: user.facebookTokenExpiry
  });
}));

export default router;