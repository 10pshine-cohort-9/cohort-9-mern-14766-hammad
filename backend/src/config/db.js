const mongoose = require("mongoose");

const { mongoUri } = require("./env");

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

const disconnectDB = () => mongoose.connection.close();

module.exports = { connectDB, disconnectDB };
