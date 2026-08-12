// Mocha loads this before any spec file (see .mocharc.json), which matters
// because src/config/env.js reads process.env at require time and throws when
// MONGODB_URI or JWT_SECRET are missing. dotenv does not overwrite variables
// that are already set, so assigning them here also keeps a developer's local
// .env out of the test run.
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/notes-api-test";
process.env.JWT_SECRET = "test-jwt-secret-not-used-anywhere-real";
process.env.JWT_EXPIRES_IN = "1h";
// 10 rounds is the right production default and far too slow to pay per test.
// 4 exercises the same code path.
process.env.BCRYPT_SALT_ROUNDS = "4";
process.env.CORS_ORIGIN = "*";
process.env.BODY_LIMIT = "10kb";
// Nothing here asserts on log output, and pino would otherwise print a line
// for every request the route tests make.
process.env.LOG_LEVEL = "silent";

const sinon = require("sinon");

// No spec can leak a stubbed model method into the next one.
exports.mochaHooks = {
  afterEach() {
    sinon.restore();
  },
};
