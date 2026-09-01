const request = require("supertest");
const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");

const app = require("../../src/app");
const authService = require("../../src/services/auth.service");
const noteService = require("../../src/services/note.service");
const User = require("../../src/models/user.model");

describe("API Integration Route Tests", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const validUser = {
    _id: "507f191e810c19729de860ea",
    id: "507f191e810c19729de860ea",
    name: "Hammad Masood",
    email: "hammad@example.com",
    role: "user",
  };

  const validToken = "Bearer valid.mock.jwt.token";

  describe("Authentication Endpoints", () => {
    describe("POST /api/v1/auth/register", () => {
      it("should register a user when payload is valid", async () => {
        const payload = {
          name: "Hammad Masood",
          email: "hammad@example.com",
          password: "Password123!",
        };

        const mockResponse = {
          user: { id: validUser.id, name: payload.name, email: payload.email, role: "user" },
          token: "mock-jwt-token",
        };

        sandbox.stub(authService, "register").resolves(mockResponse);

        const res = await request(app)
          .post("/api/v1/auth/register")
          .send(payload)
          .expect(201);

        expect(res.body.success).to.be.true;
        expect(res.body.message).to.equal("Account created successfully");
        expect(res.body.data).to.deep.equal(mockResponse);
      });

      it("should return 422 error when registration validation fails", async () => {
        const payload = {
          name: "H",
          email: "invalid-email",
          password: "123",
        };

        const res = await request(app)
          .post("/api/v1/auth/register")
          .send(payload)
          .expect(422);

        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal("Validation failed");
        expect(res.body.errors).to.be.an("array");
      });
    });

    describe("POST /api/v1/auth/login", () => {
      it("should log in user with valid credentials", async () => {
        const payload = {
          email: "hammad@example.com",
          password: "Password123!",
        };

        const mockResponse = {
          user: { id: validUser.id, email: payload.email, role: "user" },
          token: "mock-jwt-token",
        };

        sandbox.stub(authService, "login").resolves(mockResponse);

        const res = await request(app)
          .post("/api/v1/auth/login")
          .send(payload)
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.message).to.equal("Logged in successfully");
        expect(res.body.data).to.deep.equal(mockResponse);
      });

      it("should return 422 when login body is missing required fields", async () => {
        const res = await request(app)
          .post("/api/v1/auth/login")
          .send({})
          .expect(422);

        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal("Validation failed");
      });
    });

    describe("GET /api/v1/auth/me", () => {
      it("should return profile details for authenticated request", async () => {
        sandbox.stub(jwt, "verify").returns({ sub: validUser.id });
        sandbox.stub(User, "findById").resolves({
          ...validUser,
          toJSON: () => ({ id: validUser.id, name: validUser.name, email: validUser.email }),
        });

        const res = await request(app)
          .get("/api/v1/auth/me")
          .set("Authorization", validToken)
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.user.id).to.equal(validUser.id);
      });
    });
  });

  describe("Unauthorized Access Checks", () => {
    it("should return 401 when accessing protected GET /api/v1/notes without token", async () => {
      const res = await request(app)
        .get("/api/v1/notes")
        .expect(401);

      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("Authentication required");
    });

    it("should return 401 when accessing protected POST /api/v1/notes without token", async () => {
      const res = await request(app)
        .post("/api/v1/notes")
        .send({ title: "Test", content: "Content" })
        .expect(401);

      expect(res.body.success).to.be.false;
    });

    it("should return 401 when accessing protected PATCH /api/v1/notes/:id without token", async () => {
      const res = await request(app)
        .patch("/api/v1/notes/607f191e810c19729de860eb")
        .send({ title: "Updated" })
        .expect(401);

      expect(res.body.success).to.be.false;
    });

    it("should return 401 when accessing protected DELETE /api/v1/notes/:id without token", async () => {
      const res = await request(app)
        .delete("/api/v1/notes/607f191e810c19729de860eb")
        .expect(401);

      expect(res.body.success).to.be.false;
    });
  });

  describe("Note Endpoints (Authenticated)", () => {
    beforeEach(() => {
      sandbox.stub(jwt, "verify").returns({ sub: validUser.id });
      sandbox.stub(User, "findById").resolves({
        ...validUser,
        toJSON: () => ({ id: validUser.id }),
      });
    });

    describe("POST /api/v1/notes", () => {
      it("should create a note and return 201 Created", async () => {
        const payload = { title: "Meeting Notes", content: "Discuss Q3 roadmap" };
        const mockNote = { id: "607f191e810c19729de860eb", ...payload };

        sandbox.stub(noteService, "createNote").resolves({ note: mockNote });

        const res = await request(app)
          .post("/api/v1/notes")
          .set("Authorization", validToken)
          .send(payload)
          .expect(201);

        expect(res.body.success).to.be.true;
        expect(res.body.message).to.equal("Note created successfully");
        expect(res.body.data.note).to.deep.equal(mockNote);
      });

      it("should return 422 when note title is missing", async () => {
        const res = await request(app)
          .post("/api/v1/notes")
          .set("Authorization", validToken)
          .send({ content: "Only content provided" })
          .expect(422);

        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal("Validation failed");
      });
    });

    describe("GET /api/v1/notes", () => {
      it("should fetch all user notes", async () => {
        const mockData = {
          notes: [{ id: "607f191e810c19729de860eb", title: "Note 1", content: "Content 1" }],
          count: 1,
        };

        sandbox.stub(noteService, "getNotes").resolves(mockData);

        const res = await request(app)
          .get("/api/v1/notes")
          .set("Authorization", validToken)
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data).to.deep.equal(mockData);
      });
    });

    describe("GET /api/v1/notes/:id", () => {
      it("should return single note for valid id", async () => {
        const noteId = "607f191e810c19729de860eb";
        const mockNote = { id: noteId, title: "Note 1", content: "Content 1" };

        sandbox.stub(noteService, "getNote").resolves({ note: mockNote });

        const res = await request(app)
          .get(`/api/v1/notes/${noteId}`)
          .set("Authorization", validToken)
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.data.note).to.deep.equal(mockNote);
      });

      it("should return 422 when id is not a valid Mongo ObjectId", async () => {
        const res = await request(app)
          .get("/api/v1/notes/invalid-id-123")
          .set("Authorization", validToken)
          .expect(422);

        expect(res.body.success).to.be.false;
      });
    });

    describe("PATCH /api/v1/notes/:id", () => {
      it("should update a note title and content", async () => {
        const noteId = "607f191e810c19729de860eb";
        const payload = { title: "Updated Note" };
        const mockUpdated = { id: noteId, title: "Updated Note", content: "Original content" };

        sandbox.stub(noteService, "updateNote").resolves({ note: mockUpdated });

        const res = await request(app)
          .patch(`/api/v1/notes/${noteId}`)
          .set("Authorization", validToken)
          .send(payload)
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.message).to.equal("Note updated successfully");
        expect(res.body.data.note).to.deep.equal(mockUpdated);
      });
    });

    describe("DELETE /api/v1/notes/:id", () => {
      it("should delete a note and return 200 OK", async () => {
        const noteId = "607f191e810c19729de860eb";

        sandbox.stub(noteService, "deleteNote").resolves();

        const res = await request(app)
          .delete(`/api/v1/notes/${noteId}`)
          .set("Authorization", validToken)
          .expect(200);

        expect(res.body.success).to.be.true;
        expect(res.body.message).to.equal("Note deleted successfully");
      });
    });
  });

  describe("404 Route Not Found", () => {
    it("should return 404 for unknown endpoints", async () => {
      const res = await request(app)
        .get("/api/v1/unknown-path")
        .expect(404);

      expect(res.body.success).to.be.false;
      expect(res.body.message).to.contain("Route not found");
    });
  });
});
