const mongoose = require("mongoose");

const { mongoUri } = require("./env");
const logger = require("./logger");

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(mongoUri);
  logger.info({ event: "db.connected", host: conn.connection.host }, "MongoDB connected");

  // Mongoose reconnects on its own, so a dropped connection is a warning
  // rather than a fatal error — but it explains request failures either way.
  mongoose.connection.on("disconnected", () => {
    logger.warn({ event: "db.disconnected" }, "MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ event: "db.error", err }, "MongoDB connection error");
  });
};

const disconnectDB = () => mongoose.connection.close();

module.exports = { connectDB, disconnectDB };
