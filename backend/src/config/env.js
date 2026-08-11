require("dotenv").config();

const { MONGODB_URI, JWT_SECRET } = process.env;

if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

module.exports = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: MONGODB_URI,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  // debug is noisy but useful locally; production stays at info so the
  // volume stays affordable.
  logLevel: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
};
