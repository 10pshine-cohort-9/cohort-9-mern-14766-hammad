const { expect } = require("chai");
const sinon = require("sinon");

const audit = require("../../../src/middleware/audit.middleware");
const { fakeReq, fakeRes, fakeUser, objectId } = require("../../helpers");

describe("middleware/audit.middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = fakeReq();
    res = fakeRes();
    next = sinon.stub();
  });

  /**
   * Drives one request through the middleware: send a payload, settle on a
   * status, then fire the "finish" event the middleware listens for. Waiting
   * for finish is what makes the status code final, so an error converted by
   * errorHandler is reflected accurately.
   */
  const runRequest = ({ action = "note.create", payload, statusCode = 200 } = {}) => {
    audit(action)(req, res, next);
    if (payload !== undefined) res.json(payload);
    res.statusCode = statusCode;
    res.emit("finish");
  };

  it("continues the request immediately, before anything is logged", () => {
    audit("note.create")(req, res, next);

    expect(next.calledOnceWithExactly()).to.be.true;
    expect(req.log.info.called).to.be.false;
  });

  it("still sends the payload it inspected", () => {
    const payload = { success: true, message: "ok" };

    runRequest({ payload });

    expect(res.body).to.deep.equal(payload);
  });

  describe("outcome and level", () => {
    it("logs a success at info", () => {
      runRequest({ statusCode: 201 });

      expect(req.log.info.calledOnce).to.be.true;
      const [fields, message] = req.log.info.firstCall.args;
      expect(fields).to.include({
        event: "note.create",
        outcome: "success",
        statusCode: 201,
      });
      expect(message).to.equal("note.create succeeded");
    });

    // 4xx is the caller's mistake, so it is a warning rather than an error.
    it("logs a client rejection at warn", () => {
      runRequest({ action: "note.update", statusCode: 422 });

      expect(req.log.warn.calledOnce).to.be.true;
      expect(req.log.warn.firstCall.args[0]).to.include({
        outcome: "failure",
        statusCode: 422,
      });
      expect(req.log.warn.firstCall.args[1]).to.equal("note.update failed");
    });

    it("logs a server failure at error", () => {
      runRequest({ action: "note.delete", statusCode: 500 });

      expect(req.log.error.calledOnce).to.be.true;
      expect(req.log.error.firstCall.args[0]).to.include({ outcome: "failure" });
    });

    it("treats 400 as the first failing status", () => {
      runRequest({ statusCode: 400 });

      expect(req.log.warn.firstCall.args[0].outcome).to.equal("failure");
    });

    it("treats a 3xx redirect as a success", () => {
      runRequest({ statusCode: 304 });

      expect(req.log.info.firstCall.args[0].outcome).to.equal("success");
    });
  });

  describe("identifying the record acted on", () => {
    it("prefers the id from the path", () => {
      const id = String(objectId());
      req = fakeReq({ params: { id } });

      runRequest({ action: "note.update" });

      expect(req.log.info.firstCall.args[0].resourceId).to.equal(id);
    });

    // Responses are shaped { success, message, data }, with the id one level
    // inside data — so no controller has to log anything itself.
    it("digs the id out of the response body when the path has none", () => {
      const noteId = String(objectId());

      runRequest({ payload: { success: true, data: { note: { id: noteId } } } });

      expect(req.log.info.firstCall.args[0].resourceId).to.equal(noteId);
    });

    it("leaves the id undefined when neither carries one", () => {
      runRequest({ action: "note.list", payload: { success: true, data: { notes: [] } } });

      expect(req.log.info.firstCall.args[0].resourceId).to.be.undefined;
    });

    it("copes with a response that has no data at all", () => {
      runRequest({ payload: { success: true, message: "Note deleted successfully" } });

      expect(req.log.info.firstCall.args[0].resourceId).to.be.undefined;
    });

    it("copes with a request that never sent a body", () => {
      runRequest({ statusCode: 500 });

      expect(req.log.error.firstCall.args[0].resourceId).to.be.undefined;
    });

    it("ignores a data payload that is not an object", () => {
      runRequest({ payload: { success: true, data: "just a string" } });

      expect(req.log.info.firstCall.args[0].resourceId).to.be.undefined;
    });
  });

  describe("identifying the actor", () => {
    it("uses the authenticated user when there is one", () => {
      const user = fakeUser();
      req = fakeReq({ user, params: { id: String(objectId()) } });

      runRequest({ action: "note.update" });

      expect(req.log.info.firstCall.args[0].userId).to.equal(String(user.id));
    });

    // On register and login the acting user only exists in the response, where
    // it is also the record being acted on.
    it("falls back to the id in the response on register and login", () => {
      const userId = String(objectId());

      runRequest({ action: "auth.register", payload: { data: { user: { id: userId } } } });

      expect(req.log.info.firstCall.args[0].userId).to.equal(userId);
    });

    it("leaves the actor undefined on a rejected login", () => {
      runRequest({
        action: "auth.login",
        payload: { success: false, message: "Invalid email or password" },
        statusCode: 401,
      });

      expect(req.log.warn.firstCall.args[0].userId).to.be.undefined;
    });
  });

  it("records how long the request took", () => {
    runRequest();

    const { durationMs } = req.log.info.firstCall.args[0];
    expect(durationMs).to.be.a("number");
    expect(durationMs).to.be.at.least(0);
  });

  it("logs exactly one line per request", () => {
    runRequest({ payload: { success: true, data: { note: { id: "abc" } } } });

    const calls =
      req.log.info.callCount + req.log.warn.callCount + req.log.error.callCount;
    expect(calls).to.equal(1);
  });
});
