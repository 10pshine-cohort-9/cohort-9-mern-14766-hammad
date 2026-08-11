const express = require("express");
const cors = require("cors");

const { corsOrigin } = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use("/api/v1", routes);

// These two have to stay last.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
