const { expect } = require("chai");
const sinon = require("sinon");
const request = require("supertest");

const app = require("../../src/app");
const User = require("../../src/models/user.model");
const { signToken } = require("../../src/utils/jwt");
const { fakeUser } = require("../helpers");

// These drive the real Express app — routes, validators, controllers, services
// and the error handler all run. Only the Mongoose model boundary is stubbed,
// so no database is needed.
describe("POST /api/v1/auth/register", () => {
  const payload = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "Passw0rdy",
  };

  const stubFreeEmail = () => {
    sinon.stub(User, "findOne").resolves(null);
    const created = fakeUser(payload);
    sinon.stub(User, "create").resolves(created);
    return created;
  };

  it("creates the account and answers 201", async () => {
    const created = stubFreeEmail();

    const res = await request(app).post("/api/v1/auth/register").send(payload);

    expect(res.status).to.equal(201);
    expect(res.body.success).to.be.true;
    expect(res.body.message).to.equal("Account created successfully");
    expect(res.body.data.user.id).to.equal(String(created._id));
    expect(res.body.data.token).to.be.a("string");
  });

  it("never returns the password", async () => {
    stubFreeEmail();

    const res = await request(app).post("/api/v1/auth/register").send(payload);

    expect(res.body.data.user).to.not.have.property("password");
    expect(res.text).to.not.include("Passw0rdy");
  });

  it("normalises the email before looking it up", async () => {
    const findOne = sinon.stub(User, "findOne").resolves(null);
    sinon.stub(User, "create").resolves(fakeUser(payload));

    await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, email: "  Ada@Example.COM  " });

    expect(findOne.calledOnceWithExactly({ email: "ada@example.com" })).to.be.true;
  });

  it("rejects a duplicate email with 409", async () => {
    sinon.stub(User, "findOne").resolves(fakeUser(payload));

    const res = await request(app).post("/api/v1/auth/register").send(payload);

    expect(res.status).to.equal(409);
    expect(res.body).to.deep.equal({
      success: false,
      message: "An account with that email already exists",
    });
  });

  // Reports every bad field at once instead of one per round trip.
  it("lists every missing field in one 422", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({});

    expect(res.status).to.equal(422);
    expect(res.body.message).to.equal("Validation failed");
    expect(res.body.errors.map((e) => e.field)).to.have.members([
      "name",
      "email",
      "password",
    ]);
  });

  it("rejects a malformed email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, email: "ada-at-example" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "email",
      message: "Please provide a valid email address",
    });
  });

  it("rejects a name shorter than two characters", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, name: "A" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "name",
      message: "Name must be between 2 and 50 characters",
    });
  });

  it("rejects a password shorter than eight characters", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, password: "Pass0rd" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "password",
      message: "Password must be between 8 and 72 characters",
    });
  });

  // bcrypt ignores anything past 72 bytes, so a longer password is rejected
  // rather than silently truncated.
  it("rejects a password longer than 72 characters", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, password: `Aa1${"x".repeat(70)}` });

    expect(res.status).to.equal(422);
    expect(res.body.errors[0].field).to.equal("password");
  });

  it("rejects a password with no uppercase letter", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, password: "passw0rdy" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "password",
      message: "Password must contain at least one uppercase letter",
    });
  });

  it("rejects a password with no lowercase letter", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, password: "PASSW0RDY" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "password",
      message: "Password must contain at least one lowercase letter",
    });
  });

  it("rejects a password with no digit", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, password: "Passwordy" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "password",
      message: "Password must contain at least one number",
    });
  });

  // The role is not in the validator chain and the controller forwards only
  // three fields, so it cannot reach the model.
  it("ignores a role smuggled into the body", async () => {
    sinon.stub(User, "findOne").resolves(null);
    const create = sinon.stub(User, "create").resolves(fakeUser(payload));

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...payload, role: "admin" });

    expect(res.status).to.equal(201);
    expect(create.firstCall.args[0]).to.not.have.property("role");
    expect(res.body.data.user.role).to.equal("user");
  });

  it("maps a duplicate key error from the index to a 409", async () => {
    sinon.stub(User, "findOne").resolves(null);
    sinon
      .stub(User, "create")
      .rejects(Object.assign(new Error("E11000"), { code: 11000, keyPattern: { email: 1 } }));

    const res = await request(app).post("/api/v1/auth/register").send(payload);

    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal("An account with that email already exists");
  });

  it("hides an unexpected failure behind a generic 500", async () => {
    sinon.stub(User, "findOne").rejects(new Error("mongodb://user:hunter2@host is down"));

    const res = await request(app).post("/api/v1/auth/register").send(payload);

    expect(res.status).to.equal(500);
    expect(res.body).to.deep.equal({ success: false, message: "Internal server error" });
    expect(res.text).to.not.include("hunter2");
  });
});

describe("POST /api/v1/auth/login", () => {
  const credentials = { email: "ada@example.com", password: "Passw0rdy" };

  const stubLookup = (resolved) => {
    const select = sinon.stub().resolves(resolved);
    sinon.stub(User, "findOne").returns({ select });
    return select;
  };

  it("answers 200 with a token", async () => {
    const user = fakeUser({ email: credentials.email });
    stubLookup(user);

    const res = await request(app).post("/api/v1/auth/login").send(credentials);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Logged in successfully");
    expect(res.body.data.user.id).to.equal(String(user._id));
    expect(res.body.data.token).to.be.a("string");
  });

  it("never returns the password", async () => {
    stubLookup(fakeUser({ password: "$2b$04$storedhash" }));

    const res = await request(app).post("/api/v1/auth/login").send(credentials);

    expect(res.body.data.user).to.not.have.property("password");
    expect(res.text).to.not.include("storedhash");
  });

  it("rejects a wrong password with 401", async () => {
    const user = fakeUser();
    user.comparePassword.resolves(false);
    stubLookup(user);

    const res = await request(app).post("/api/v1/auth/login").send(credentials);

    expect(res.status).to.equal(401);
    expect(res.body).to.deep.equal({
      success: false,
      message: "Invalid email or password",
    });
  });

  // An unknown email and a wrong password must be indistinguishable, or the
  // endpoint becomes a way to find out which emails are registered.
  it("answers an unknown email identically to a wrong password", async () => {
    stubLookup(null);
    const unknown = await request(app).post("/api/v1/auth/login").send(credentials);
    sinon.restore();

    const user = fakeUser();
    user.comparePassword.resolves(false);
    stubLookup(user);
    const wrongPassword = await request(app).post("/api/v1/auth/login").send(credentials);

    expect(unknown.status).to.equal(wrongPassword.status);
    expect(unknown.body).to.deep.equal(wrongPassword.body);
  });

  it("requires an email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ password: "Passw0rdy" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "email",
      message: "Email is required",
    });
  });

  it("requires a password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ada@example.com" });

    expect(res.status).to.equal(422);
    expect(res.body.errors).to.deep.include({
      field: "password",
      message: "Password is required",
    });
  });

  // No strength rules on login — the password either matches the hash or it
  // does not, and applying them would reject legacy passwords.
  it("does not apply password strength rules", async () => {
    const user = fakeUser();
    user.comparePassword.resolves(false);
    stubLookup(user);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ada@example.com", password: "weak" });

    expect(res.status).to.equal(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns the authenticated profile", async () => {
    const user = fakeUser();
    sinon.stub(User, "findById").resolves(user);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${signToken(user)}`);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Profile retrieved successfully");
    expect(res.body.data.user).to.deep.include({
      id: String(user._id),
      email: user.email,
      role: "user",
    });
  });

  it("never returns the password", async () => {
    const user = fakeUser({ password: "$2b$04$storedhash" });
    sinon.stub(User, "findById").resolves(user);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${signToken(user)}`);

    expect(res.body.data.user).to.not.have.property("password");
  });
});
