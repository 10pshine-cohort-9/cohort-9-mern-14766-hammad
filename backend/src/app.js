const express = require("express");
const cors = require("cors");

const { corsOrigin } = require("./config/env");
const routes = require("./routes");
const { httpLogger } = require("./middleware/logger.middleware");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// First in the chain, so a request that is rejected by CORS or dies in the
// body parser still gets a request id and a log line.
app.use(httpLogger);

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use("/api/v1", routes);

// These two have to stay last.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
