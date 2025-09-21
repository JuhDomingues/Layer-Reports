import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { requireAuth, requireFacebookToken, AuthenticatedRequest } from '../middleware/auth';
import { validateAccountId } from '../middleware/validation';
import { FacebookApiService } from '../services/facebookApi';

const router = express.Router();

/**
 * Get user's Facebook ad accounts
 */
router.get('/', requireAuth, requireFacebookToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { facebookAccessToken: true }
  });

  if (!user?.facebookAccessToken) {
    throw new AppError('Facebook token not found', 404, 'FACEBOOK_TOKEN_NOT_FOUND');
  }

  const facebookApi = new FacebookApiService(user.facebookAccessToken);
  const facebookAccounts = await facebookApi.getAdAccounts();

  // Get user's synced accounts from database
  const syncedAccounts = await prisma.account.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      facebookAccountId: true,
      accountName: true,
      currency: true,
      timezone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { campaigns: true }
      }
    }
  });

  // Merge Facebook data with local data
  const accounts = facebookAccounts.map(fbAccount => {
    const syncedAccount = syncedAccounts.find(
      acc => acc.facebookAccountId === fbAccount.id
    );

    return {
      id: fbAccount.id,
      name: fbAccount.name,
      currency: fbAccount.currency,
      timezone: fbAccount.timezone_name,
      status: fbAccount.account_status,
      isSynced: !!syncedAccount,
      localId: syncedAccount?.id,
      campaignCount: syncedAccount?._count.campaigns || 0,
      lastSyncAt: syncedAccount?.updatedAt,
      isActive: syncedAccount?.isActive ?? true
    };
  });

  res.json({
    accounts,
    total: accounts.length,
    synced: syncedAccounts.length
  });
}));

/**
 * Sync/Add account to user's dashboard
 */
router.post('/sync/:accountId', requireAuth, requireFacebookToken, validateAccountId, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new AppError('Facebook token not found', 404, 'FACEBOOK_TOKEN_NOT_FOUND');
    }

    // Get account details from Facebook
    const facebookApi = new FacebookApiService(user.facebookAccessToken);
    const facebookAccounts = await facebookApi.getAdAccounts();
    
    const facebookAccount = facebookAccounts.find(acc => acc.id === accountId);
    if (!facebookAccount) {
      throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    // Check if account is already synced
    const existingAccount = await prisma.account.findUnique({
      where: {
        userId_facebookAccountId: {
          userId: req.user!.id,
          facebookAccountId: accountId
        }
      }
    });

    if (existingAccount) {
      // Update existing account
      const updatedAccount = await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          accountName: facebookAccount.name,
          currency: facebookAccount.currency,
          timezone: facebookAccount.timezone_name,
          isActive: true,
          updatedAt: new Date()
        }
      });

      logger.info('Account updated', { 
        userId: req.user!.id, 
        accountId,
        localAccountId: updatedAccount.id 
      });

      return res.json({
        message: 'Account updated successfully',
        account: updatedAccount
      });
    }

    // Create new account
    const newAccount = await prisma.account.create({
      data: {
        userId: req.user!.id,
        facebookAccountId: accountId,
        accountName: facebookAccount.name,
        currency: facebookAccount.currency,
        timezone: facebookAccount.timezone_name,
        isActive: true
      }
    });

    logger.info('Account synced successfully', { 
      userId: req.user!.id, 
      accountId,
      localAccountId: newAccount.id 
    });

    res.status(201).json({
      message: 'Account synced successfully',
      account: newAccount
    });
  })
);

/**
 * Get specific account details
 */
router.get('/:accountId', requireAuth, validateAccountId, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        facebookAccountId: accountId
      },
      include: {
        _count: {
          select: { campaigns: true }
        }
      }
    });

    if (!account) {
      throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    res.json({ account });
  })
);

/**
 * Update account settings
 */
router.put('/:accountId', requireAuth, validateAccountId, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;
    const { isActive } = req.body;

    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        facebookAccountId: accountId
      }
    });

    if (!account) {
      throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        isActive: isActive ?? account.isActive,
        updatedAt: new Date()
      }
    });

    logger.info('Account settings updated', { 
      userId: req.user!.id, 
      accountId,
      localAccountId: account.id 
    });

    res.json({
      message: 'Account updated successfully',
      account: updatedAccount
    });
  })
);

/**
 * Remove account from dashboard
 */
router.delete('/:accountId', requireAuth, validateAccountId, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        userId: req.user!.id,
        facebookAccountId: accountId
      }
    });

    if (!account) {
      throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    // Delete account and all related data (cascading)
    await prisma.account.delete({
      where: { id: account.id }
    });

    logger.info('Account removed from dashboard', { 
      userId: req.user!.id, 
      accountId,
      localAccountId: account.id 
    });

    res.json({ message: 'Account removed successfully' });
  })
);

/**
 * Get account permissions from Facebook
 */
router.get('/:accountId/permissions', requireAuth, requireFacebookToken, validateAccountId,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { facebookAccessToken: true }
    });

    if (!user?.facebookAccessToken) {
      throw new AppError('Facebook token not found', 404, 'FACEBOOK_TOKEN_NOT_FOUND');
    }

    const facebookApi = new FacebookApiService(user.facebookAccessToken);
    const permissions = await facebookApi.getAccountPermissions(accountId);

    res.json({
      accountId,
      permissions,
      hasRequiredPermissions: permissions.includes('ads_read') || permissions.includes('ads_management')
    });
  })
);

export default router;