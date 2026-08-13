const { statusLevel } = require("./logger.middleware");

// Responses in this API are all shaped { success, message, data }, and the
// interesting id sits one level inside data ({ note: {...} }, { user: {...} }).
// Pulling it out here means no controller has to log anything itself.
const resourceIdFrom = (req, body) => {
  if (req.params && req.params.id) return req.params.id;

  const data = body && body.data;
  if (!data || typeof data !== "object") return undefined;

  const entity = Object.values(data).find(
    (value) => value && typeof value === "object" && value.id
  );
  return entity ? String(entity.id) : undefined;
};

/**
 * Records one domain event per request: who did what, to which record, and
 * whether it worked. Declared on the route rather than inside the handler, so
 * the controllers and services stay free of logging calls.
 *
 * The event fires on "finish", which means the status code is final and an
 * error that was converted by errorHandler is reflected accurately.
 */
const audit = (action) => (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  // res.json is the only way these handlers reply, so wrapping it is enough
  // to see what was sent without buffering the whole response.
  const sendJson = res.json.bind(res);
  let body;
  res.json = (payload) => {
    body = payload;
    return sendJson(payload);
  };

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const succeeded = res.statusCode < 400;
    const resourceId = resourceIdFrom(req, body);

    req.log[statusLevel(res.statusCode)](
      {
        event: action,
        outcome: succeeded ? "success" : "failure",
        // req.user is set by authenticate for protected routes; on
        // register/login the acting user only exists in the response, where
        // it is also the record being acted on.
        userId: req.user ? String(req.user.id) : resourceId,
        resourceId,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      },
      `${action} ${succeeded ? "succeeded" : "failed"}`
    );
  });

  next();
};

module.exports = audit;
