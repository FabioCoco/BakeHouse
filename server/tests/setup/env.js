// Runs before each test file. Sets the env vars that config/env.js validates on import.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/bakehouse_test';
process.env.JWT_SECRET = 'test_secret_that_is_long_enough_for_hs256_signing';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
process.env.SHIPPING_FEE = '15000';
process.env.FREE_SHIPPING_THRESHOLD = '250000';
process.env.BANK_NAME = 'BCA';
process.env.BANK_ACCOUNT_NUMBER = '1234567890';
process.env.BANK_ACCOUNT_HOLDER = 'BakeHouse';
