import { body } from 'express-validator';

const passwordRule = () =>
  body('password')
    .isString()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8 to 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number');

const emailRule = () =>
  body('email')
    .isString()
    .withMessage('Email is required')
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Email is not valid');

export const registerRules = () => [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  emailRule(),
  passwordRule(),
];

export const loginRules = () => [
  emailRule(),
  body('password').isString().withMessage('Password is required').bail().notEmpty().withMessage('Password is required'),
];

export const googleRules = () => [
  body('credential').isString().withMessage('Google credential is required').bail().notEmpty().withMessage('Google credential is required'),
];
