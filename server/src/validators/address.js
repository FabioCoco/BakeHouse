import { body } from 'express-validator';

const PHONE_PATTERN = /^\+?[0-9\s()-]{6,20}$/;
const POSTAL_CODE_PATTERN = /^[0-9A-Za-z -]{3,10}$/;

// Builds the rules for one address field. Set `when` to only check it if a condition holds.
const addressField = (path, { max, required, pattern, label, when }) => {
  let chain = body(path)
    .isString()
    .withMessage(`${label} must be text`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .isLength({ max })
    .withMessage(`${label} must be at most ${max} characters`);

  if (pattern) {
    chain = chain.matches(pattern).withMessage(`${label} is not valid`);
  }
  if (!required) {
    chain = chain.optional();
  }
  if (when) {
    chain = chain.if(when);
  }
  return chain;
};

// Fields shared by saved addresses and checkout snapshots.
const ADDRESS_FIELDS = {
  recipientName: { max: 100, label: 'Recipient name' },
  phone: { max: 20, pattern: PHONE_PATTERN, label: 'Phone' },
  street: { max: 200, label: 'Street' },
  city: { max: 100, label: 'City' },
  province: { max: 100, label: 'Province' },
  postalCode: { max: 10, pattern: POSTAL_CODE_PATTERN, label: 'Postal code' },
};

export const addressRules = ({ partial = false } = {}) => [
  addressField('label', { max: 40, label: 'Label', required: false }),
  ...Object.entries(ADDRESS_FIELDS).map(([name, opts]) =>
    addressField(name, { ...opts, required: !partial }),
  ),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean').toBoolean(),
];

// Checkout accepts a full address object, nested under "address". It is only checked when present.
export const checkoutAddressRules = () => {
  const when = body('address').exists();
  return Object.entries(ADDRESS_FIELDS).map(([name, opts]) =>
    addressField(`address.${name}`, { ...opts, required: true, when }),
  );
};
