const app = require("./src/app");
const { port } = require("./src/config/env");
const { connectDB, disconnectDB } = require("./src/config/db");

let server;

const start = async () => {
  try {
    await connectDB();
    server = app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

// Stop taking new connections first, then drop the DB handle, so requests
// that are already in flight get to finish.
const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown("unhandledRejection");
});

start();
