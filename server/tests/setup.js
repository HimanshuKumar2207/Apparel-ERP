// Test environment (no database needed for these tests)
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/erp_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-test-access-secret-1234';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret-123';
process.env.FIELD_ENCRYPTION_KEY = 'ab'.repeat(32);
