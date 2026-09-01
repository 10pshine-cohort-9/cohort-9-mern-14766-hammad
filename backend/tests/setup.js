process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test_db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_123456789";
process.env.LOG_LEVEL = "fatal";
