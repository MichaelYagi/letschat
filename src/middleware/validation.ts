import { Request, Response, NextFunction } from 'express';
import { body, validationResult, query, param } from 'express-validator';

// Common validation chains
export const validations = {
  // Authentication validations
  login: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be 3-20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        'Username can only contain letters, numbers, and underscores'
      ),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be 3-20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        'Username can only contain letters, numbers, and underscores'
      ),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be 8-128 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
      .withMessage('Password must contain at least one special character'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Display name must be 50 characters or less')
      .escape(),
  ],

  // Message validations
  sendMessage: [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content cannot be empty')
      .isLength({ max: 4000 })
      .withMessage('Message cannot exceed 4000 characters')
      .custom(value => {
        // Additional XSS prevention
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
        ];

        for (const pattern of xssPatterns) {
          if (pattern.test(value)) {
            throw new Error('Message contains potentially dangerous content');
          }
        }
        return true;
      }),
    body('contentType')
      .optional()
      .isIn(['text', 'image', 'file'])
      .withMessage('Invalid content type'),
    body('replyToId').optional().isUUID().withMessage('Invalid reply-to ID'),
  ],

  // Conversation validations
  createConversation: [
    body('type')
      .isIn(['direct', 'group'])
      .withMessage('Conversation type must be direct or group'),
    body('participantUsername')
      .if(body('type').equals('direct'))
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be 3-20 characters'),
    body('name')
      .if(body('type').equals('group'))
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Group name must be 1-100 characters')
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be 500 characters or less')
      .escape(),
  ],

  // Connection validations
  connectionRequest: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be 3-20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        'Username can only contain letters, numbers, and underscores'
      ),
  ],

  // URL parameter validations
  uuid: [
    param('id').isUUID().withMessage('Invalid ID format'),
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('messageId').isUUID().withMessage('Invalid message ID'),
    param('fileId').isUUID().withMessage('Invalid file ID'),
  ],

  // Query validations
  pagination: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    query('before').optional().isUUID().withMessage('Invalid cursor ID'),
    query('after').optional().isUUID().withMessage('Invalid cursor ID'),
  ],

  search: [
    query('query')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be 1-100 characters')
      .escape(),
  ],
};

// Input sanitization middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize string fields in body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  next();
};

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        // Basic XSS prevention
        obj[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof value === 'object' && value !== null) {
        sanitizeObject(value);
      }
    }
  }
}

// Validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: (error as any).param,
      message: (error as any).msg,
      value: (error as any).value,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: formattedErrors,
      },
    });
  }

  next();
};

// Validation middleware helper
export const validateRequest = (validations: any[]) => {
  return [...validations, handleValidationErrors];
};
