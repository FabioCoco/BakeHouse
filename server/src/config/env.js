import 'dotenv/config';

const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY'];

const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const readInt = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
};

const readBoolean = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  if (raw !== 'true' && raw !== 'false') {
    throw new Error(`${name} must be "true" or "false"`);
  }
  return raw === 'true';
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Dev: same-site cookies ('lax'). Production with a client on another domain needs 'none' + secure.
const sameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');
if (!['lax', 'strict', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be one of: lax, strict, none');
}

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  isTest: nodeEnv === 'test',
  port: readInt('PORT', 5000),
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cookie: {
    name: 'token',
    sameSite,
    secure: isProduction || sameSite === 'none',
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  authRateLimitMax: readInt('AUTH_RATE_LIMIT_MAX', 100),
  shipping: {
    flatFee: readInt('SHIPPING_FEE', 15000),
    freeAbove: readInt('FREE_SHIPPING_THRESHOLD', 250000),
  },
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    isProduction: readBoolean('MIDTRANS_IS_PRODUCTION', false),
  },
});
