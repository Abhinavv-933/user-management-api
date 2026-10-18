import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import User from "../src/models/User.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User API", () => {
  it("creates a user and never returns the password hash", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "StrongPass123",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("test@example.com");
    expect(response.body.data.user.password).toBeUndefined();
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects an invalid email", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "Test User",
        email: "not-an-email",
        password: "StrongPass123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects duplicate email addresses", async () => {
    const user = {
      name: "Test User",
      email: "duplicate@example.com",
      password: "StrongPass123",
    };

    const first = await request(app).post("/users").send(user);
    const second = await request(app).post("/users").send(user);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("DUPLICATE_EMAIL");
  });

  it("returns 404 when a valid but nonexistent ID is requested", async () => {
    const response = await request(app).get(
      "/users/64a000000000000000000000"
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("rejects a malformed user ID", async () => {
    const response = await request(app).get("/users/not-an-id");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_ID");
  });

  it("lists users with pagination and without password hashes", async () => {
    await request(app).post("/users").send({
      name: "First User",
      email: "first@example.com",
      password: "StrongPass123",
    });

    await request(app).post("/users").send({
      name: "Second User",
      email: "second@example.com",
      password: "StrongPass123",
    });

    const response = await request(app).get("/users?page=1&limit=1");

    expect(response.status).toBe(200);
    expect(response.body.data.users).toHaveLength(1);
    expect(response.body.data.pagination.page).toBe(1);
    expect(response.body.data.pagination.limit).toBe(1);
    expect(response.body.data.pagination.total).toBe(2);
    expect(response.body.data.users[0].passwordHash).toBeUndefined();
  });

  it("patches only the supplied fields", async () => {
    const created = await request(app).post("/users").send({
      name: "Original Name",
      email: "patch@example.com",
      password: "StrongPass123",
    });

    const id = created.body.data.user.id;

    const response = await request(app)
      .patch(`/users/${id}`)
      .send({ name: "Updated Name" });

    expect(response.status).toBe(200);
    expect(response.body.data.user.name).toBe("Updated Name");
    expect(response.body.data.user.email).toBe("patch@example.com");
  });

   it("replaces all editable fields with PUT", async () => {
    const created = await request(app).post("/users").send({
      name: "Original Name",
      email: "original@example.com",
      password: "OriginalPass123",
    });

    const id = created.body.data.user.id;

    const response = await request(app)
      .put(`/users/${id}`)
      .send({
        name: "Replacement Name",
        email: "replacement@example.com",
        password: "ReplacementPass123",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user.name).toBe("Replacement Name");
    expect(response.body.data.user.email).toBe("replacement@example.com");
    expect(response.body.data.user.password).toBeUndefined();
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });
});
