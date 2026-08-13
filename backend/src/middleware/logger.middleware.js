const { randomUUID } = require("crypto");
const pinoHttp = require("pino-http");

const logger = require("../config/logger");

// Paths that say nothing when they succeed. Load balancers hit /health every
// few seconds and would otherwise dominate the log volume.
const QUIET_PATHS = new Set(["/api/v1/health"]);

// 5xx is ours to fix, 4xx is the caller's mistake, everything else is routine.
const statusLevel = (statusCode) => {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
};

const httpLogger = pinoHttp({
  logger,

  // Trust an id from the edge proxy when there is one so a single trace id
  // spans every hop; otherwise start one here.
  genReqId: (req, res) => {
    const incoming = req.headers["x-request-id"];
    const id = incoming || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },

  customLogLevel: (req, res, err) => {
    if (err) return "error";
    return statusLevel(res.statusCode);
  },

  // One line when the request arrives, one when it is answered. The arrival
  // line is what proves a request reached us at all if the process dies
  // mid-handler.
  customReceivedMessage: (req) => `--> ${req.method} ${req.url}`,
  customSuccessMessage: (req, res) =>
    `<-- ${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `<-- ${req.method} ${req.url} ${res.statusCode} ${err.message}`,

  // authenticate() runs after this middleware, so req.user is only set by the
  // time the response is logged. That is exactly when it is most useful.
  customProps: (req) => ({
    userId: req.user ? String(req.user.id) : undefined,
  }),

  autoLogging: {
    ignore: (req) => QUIET_PATHS.has(req.originalUrl || req.url),
  },
});

module.exports = { httpLogger, statusLevel };
