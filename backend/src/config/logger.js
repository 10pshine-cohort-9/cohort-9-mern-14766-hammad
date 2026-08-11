const pino = require("pino");

const { nodeEnv, logLevel, isProduction } = require("./env");

// Anything matching these paths is replaced with [Redacted] on its way out,
// no matter which log call produced it. Redaction runs after serialization,
// so it also covers an object some later caller passes in by accident.
// One wildcard per path — fast-redact rejects more than that.
const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
  "password",
  "*.password",
  "token",
  "*.token",
  "authorization",
  "*.authorization",
  "secret",
  "*.secret",
];

// The stock serializers dump every header on every line, which is a lot of
// bytes for fields nobody greps. These keep the parts used for triage.
const serializers = {
  req: (req) => ({
    id: req.id,
    method: req.method,
    url: req.url,
    ip: req.remoteAddress,
    userAgent: req.headers && req.headers["user-agent"],
  }),
  res: (res) => ({
    statusCode: res.statusCode,
  }),
  err: pino.stdSerializers.err,
};

// In production the process writes JSON straight to stdout and lets the
// platform collect it — no transport, no worker thread, nothing to go wrong.
// Locally, pino-pretty makes the same records readable.
const prettyAvailable = () => {
  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    // It is a devDependency, so a production install legitimately omits it.
    return false;
  }
};

const transport =
  isProduction || !prettyAvailable()
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss.l",
          ignore: "pid,hostname,service,env",
          messageFormat: "{msg}",
        },
      };

const logger = pino({
  level: logLevel,
  // Stamped on every line so logs from several services stay separable
  // once they are shipped to the same place.
  base: { service: "notes-api", env: nodeEnv },
  // Levels as names rather than numbers: no lookup table needed to read them.
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: { paths: redactPaths, censor: "[Redacted]" },
  serializers,
  transport,
});

module.exports = logger;
