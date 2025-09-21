import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { AppError } from './errorHandler';

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      errorDetails
    );
  }
  
  next();
}

// Auth validation rules
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  handleValidationErrors
];

export const validateFacebookToken = [
  body('accessToken')
    .notEmpty()
    .withMessage('Facebook access token is required'),
  body('userID')
    .optional()
    .isString()
    .withMessage('Facebook User ID must be a string'),
  handleValidationErrors
];

// Campaign validation rules
export const validateCampaignQuery = [
  query('status')
    .optional()
    .isIn(['ACTIVE', 'PAUSED', 'ARCHIVED', 'all'])
    .withMessage('Status must be ACTIVE, PAUSED, ARCHIVED, or all'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  handleValidationErrors
];

// Insights validation rules
export const validateInsightsQuery = [
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      const startDate = new Date(req.query?.startDate as string);
      const end = new Date(endDate);
      
      if (end <= startDate) {
        throw new Error('End date must be after start date');
      }
      
      // Maximum date range of 90 days
      const daysDiff = (end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 90) {
        throw new Error('Date range cannot exceed 90 days');
      }
      
      return true;
    }),
  query('metrics')
    .optional()
    .isArray()
    .withMessage('Metrics must be an array')
    .custom((metrics: string[]) => {
      const validMetrics = [
        'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'spend',
        'conversions', 'conversion_rate', 'cost_per_conversion',
        'reach', 'frequency', 'video_views', 'link_clicks'
      ];
      
      const invalidMetrics = metrics.filter(metric => !validMetrics.includes(metric));
      if (invalidMetrics.length > 0) {
        throw new Error(`Invalid metrics: ${invalidMetrics.join(', ')}`);
      }
      
      return true;
    }),
  handleValidationErrors
];

// Parameter validation
export const validateAccountId = [
  param('accountId')
    .notEmpty()
    .withMessage('Account ID is required')
    .matches(/^act_\d+$/)
    .withMessage('Account ID must be in format act_XXXXXXX'),
  handleValidationErrors
];

export const validateCampaignId = [
  param('campaignId')
    .notEmpty()
    .withMessage('Campaign ID is required')
    .isNumeric()
    .withMessage('Campaign ID must be numeric'),
  handleValidationErrors
];