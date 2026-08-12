const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Note = require("../../src/models/note.model");
const { signToken } = require("../../src/utils/jwt");
const { jwtSecret } = require("../../src/config/env");
const { fakeUser, fakeNote, objectId } = require("../helpers");

// Every route below is protected. A note only ever belongs to one user, so
// there is no public route in the notes router at all.
const PROTECTED_ROUTES = [
  { method: "get", path: "/api/v1/auth/me" },
  { method: "post", path: "/api/v1/notes" },
  { method: "get", path: "/api/v1/notes" },
  { method: "get", path: `/api/v1/notes/${objectId()}` },
  { method: "patch", path: `/api/v1/notes/${objectId()}` },
  { method: "delete", path: `/api/v1/notes/${objectId()}` },
];

describe("unauthorized access", () => {
  // Stubbed so that a test which wrongly reaches the database is a visible
  // assertion failure rather than a silent connection timeout.
  let findById;
  let noteFindOne;
  let noteFind;
  let noteCreate;

  beforeEach(() => {
    findById = sinon.stub(User, "findById").resolves(null);
    noteFindOne = sinon.stub(Note, "findOne").resolves(null);
    noteFind = sinon.stub(Note, "find").returns({ sort: sinon.stub().resolves([]) });
    noteCreate = sinon.stub(Note, "create").resolves(fakeNote());
  });

  const expectUnauthorized = (res, message) => {
    expect(res.status).to.equal(401);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal(message);
  };

  describe("with no credentials", () => {
    PROTECTED_ROUTES.forEach(({ method, path }) => {
      it(`rejects ${method.toUpperCase()} ${path} with 401`, async () => {
        const res = await request(app)[method](path).send({
          title: "Groceries",
          content: "Milk",
        });

        expectUnauthorized(res, "Authentication required");
      });
    });

    it("never queries for a user when no token was sent", async () => {
      await request(app).get("/api/v1/notes");

      expect(findById.called).to.be.false;
    });

    it("never reads or writes a note when no token was sent", async () => {
      await request(app).post("/api/v1/notes").send({ title: "T", content: "C" });
      await request(app).get("/api/v1/notes");
      await request(app).get(`/api/v1/notes/${objectId()}`);

      expect(noteCreate.called).to.be.false;
      expect(noteFind.called).to.be.false;
      expect(noteFindOne.called).to.be.false;
    });

    // Validation runs after authenticate on the notes router, so an
    // unauthenticated request is never told which fields it also got wrong.
    it("does not leak validation detail to an anonymous caller", async () => {
      const res = await request(app).post("/api/v1/notes").send({});

      expectUnauthorized(res, "Authentication required");
      expect(res.body).to.not.have.property("errors");
    });
  });

  describe("with a malformed Authorization header", () => {
    const cases = [
      { label: "an empty header", value: "" },
      { label: "the Bearer scheme with no token", value: "Bearer" },
      { label: "the Bearer scheme with a blank token", value: "Bearer " },
      { label: "Basic authentication", value: "Basic YWRhOnNlY3JldA==" },
      { label: "an unrecognised scheme", value: "Token abc.def.ghi" },
    ];

    cases.forEach(({ label, value }) => {
      it(`rejects ${label}`, async () => {
        const res = await request(app).get("/api/v1/notes").set("Authorization", value);

        expectUnauthorized(res, "Authentication required");
      });
    });

    it("rejects a bare token sent without a scheme", async () => {
      const res = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", signToken(fakeUser()));

      expectUnauthorized(res, "Authentication required");
    });
  });

  describe("with an invalid token", () => {
    it("rejects a token that is not a JWT", async () => {
      const res = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", "Bearer not-a-jwt");

      expectUnauthorized(res, "Invalid authentication token");
    });

    it("rejects a token signed with another secret", async () => {
      const forged = jwt.sign({ sub: String(objectId()), role: "admin" }, "attacker-secret");

      const res = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${forged}`);

      expectUnauthorized(res, "Invalid authentication token");
      expect(findById.called, "a forged token must not reach the database").to.be.false;
    });

    it("rejects a token whose payload was edited to claim admin", async () => {
      const [header, , signature] = signToken(fakeUser()).split(".");
      const payload = Buffer.from(
        JSON.stringify({ sub: String(objectId()), role: "admin" })
      ).toString("base64url");

      const res = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${header}.${payload}.${signature}`);

      expectUnauthorized(res, "Invalid authentication token");
    });

    // Told apart from a bad signature so a client knows to log in again rather
    // than treating its stored credentials as wrong.
    it("tells the caller when the token has merely expired", async () => {
      const expired = jwt.sign({ sub: String(objectId()) }, jwtSecret, { expiresIn: "-1s" });

      const res = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${expired}`);

      expectUnauthorized(res, "Token has expired, please log in again");
    });

    // The user is re-read on every request, so a deleted account stops working
    // straight away instead of when its token expires.
    it("rejects a valid token whose account has been deleted", async () => {
      const res = await request(app)
        .get("/api/v1/notes")
        .set("Authorization", `Bearer ${signToken(fakeUser())}`);

      expectUnauthorized(res, "This user no longer exists");
      expect(noteFind.called).to.be.false;
    });
  });

  describe("crossing between accounts", () => {
    let alice;
    let bob;
    let bobsNote;

    beforeEach(() => {
      alice = fakeUser({ email: "alice@example.com" });
      bob = fakeUser({ email: "bob@example.com" });
      bobsNote = fakeNote({ user: bob._id, title: "Bob's secret" });
      findById.resolves(alice);
    });

    const asAlice = (method, path) =>
      request(app)[method](path).set("Authorization", `Bearer ${signToken(alice)}`);

    // A note belonging to someone else is reported as missing rather than
    // forbidden, so this cannot be used to probe for ids on other accounts.
    it("reports another account's note as 404 rather than 403", async () => {
      const res = await asAlice("get", `/api/v1/notes/${bobsNote._id}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ success: false, message: "Note not found" });
    });

    it("scopes the lookup to the caller, so the other note is never loaded", async () => {
      await asAlice("get", `/api/v1/notes/${bobsNote._id}`);

      expect(noteFindOne.calledOnce).to.be.true;
      const filter = noteFindOne.firstCall.args[0];
      expect(String(filter.user)).to.equal(String(alice._id));
      expect(String(filter.user)).to.not.equal(String(bob._id));
    });

    it("refuses to update another account's note", async () => {
      const res = await asAlice("patch", `/api/v1/notes/${bobsNote._id}`).send({
        title: "Hijacked",
      });

      expect(res.status).to.equal(404);
      expect(bobsNote.save.called).to.be.false;
    });

    it("refuses to delete another account's note", async () => {
      const res = await asAlice("delete", `/api/v1/notes/${bobsNote._id}`);

      expect(res.status).to.equal(404);
      expect(bobsNote.deleteOne.called).to.be.false;
    });

    it("lists only the caller's own notes", async () => {
      await asAlice("get", "/api/v1/notes");

      expect(String(noteFind.firstCall.args[0].user)).to.equal(String(alice._id));
    });

    // A response body that revealed which ids exist would defeat the point of
    // answering 404.
    it("gives an identical answer for a missing id and another account's id", async () => {
      const missing = await asAlice("get", `/api/v1/notes/${objectId()}`);
      const someoneElses = await asAlice("get", `/api/v1/notes/${bobsNote._id}`);

      expect(missing.status).to.equal(someoneElses.status);
      expect(missing.body).to.deep.equal(someoneElses.body);
    });
  });
});

describe("app-level handling", () => {
  it("serves the health check without authentication", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ success: true, message: "API is healthy" });
  });

  it("answers an unknown route with a 404 in the standard envelope", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");

    expect(res.status).to.equal(404);
    expect(res.body).to.deep.equal({
      success: false,
      message: "Route not found: GET /api/v1/does-not-exist",
    });
  });

  it("answers an unknown route outside the API prefix too", async () => {
    const res = await request(app).post("/nope");

    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal("Route not found: POST /nope");
  });

  it("rejects malformed JSON with a 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "ada@example.com",');

    expect(res.status).to.equal(400);
    expect(res.body).to.deep.equal({
      success: false,
      message: "Request body contains malformed JSON",
    });
  });

  // Quoting the limit is the difference between a client trimming the payload
  // and retrying it blindly.
  it("rejects an oversized body with a 413 quoting the limit", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "Ada", email: "ada@example.com", password: "a".repeat(20000) });

    expect(res.status).to.equal(413);
    expect(res.body.message).to.equal("Request body exceeds the 10kb limit");
  });

  it("stamps a request id on the response", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.headers["x-request-id"]).to.be.a("string").and.not.empty;
  });

  // Trusting an id from the edge proxy means one trace id spans every hop.
  it("reuses a request id supplied by the caller", async () => {
    const res = await request(app)
      .get("/api/v1/health")
      .set("x-request-id", "trace-from-the-edge");

    expect(res.headers["x-request-id"]).to.equal("trace-from-the-edge");
  });
});
