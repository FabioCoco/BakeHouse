import { body } from 'express-validator';

const PHONE_PATTERN = /^\+?[0-9\s()-]{6,20}$/;

export const profileRules = () => [
  body('name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('phone')
    .optional({ values: 'null' })
    .isString()
    .trim()
    .custom((value) => value === '' || PHONE_PATTERN.test(value))
    .withMessage('Phone is not valid'),
  body().custom((value) => {
    if (value.name === undefined && value.phone === undefined) {
      throw new Error('Provide name or phone');
    }
    return true;
  }),
];

// Same rules as registration, so a new password is never weaker than a new account's.
export const passwordChangeRules = () => [
  body('currentPassword').isString().withMessage('Current password is required').bail().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .withMessage('New password is required')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8 to 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];
