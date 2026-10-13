import { body } from 'express-validator';

export const categoryRules = ({ partial = false } = {}) => {
  const field = (name) => (partial ? body(name).optional() : body(name));

  return [
    field('name')
      .isString()
      .withMessage('Name is required')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 60 })
      .withMessage('Name must be at most 60 characters'),
    field('description')
      .optional({ values: 'null' })
      .isString()
      .withMessage('Description must be text')
      .isLength({ max: 300 })
      .withMessage('Description must be at most 300 characters'),
  ];
};
