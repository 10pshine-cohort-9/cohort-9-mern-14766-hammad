const app = require("./src/app");
const { port, nodeEnv } = require("./src/config/env");
const { connectDB, disconnectDB } = require("./src/config/db");
const logger = require("./src/config/logger");

let server;

const start = async () => {
  try {
    await connectDB();
    server = app.listen(port, () => {
      logger.info(
        { event: "server.started", port, nodeEnv },
        `Server is running on http://localhost:${port}`
      );
    });
  } catch (err) {
    logger.fatal({ event: "server.start_failed", err }, "Failed to start server");
    process.exit(1);
  }
};

// Stop taking new connections first, then drop the DB handle, so requests
// that are already in flight get to finish.
const shutdown = async (signal, code = 0) => {
  logger.info({ event: "server.shutdown", signal }, `${signal} received, shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  // A transport writes from a worker thread, so wait for the queued lines
  // instead of exiting out from under them and losing the shutdown record.
  await new Promise((resolve) => logger.flush(resolve));
  process.exit(code);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error({ event: "process.unhandled_rejection", err: reason }, "Unhandled rejection");
  shutdown("unhandledRejection", 1);
});

// An uncaught exception leaves the process in an unknown state: log it, then
// let the supervisor restart us rather than carrying on.
process.on("uncaughtException", (err) => {
  logger.fatal({ event: "process.uncaught_exception", err }, "Uncaught exception");
  shutdown("uncaughtException", 1);
});

start();
