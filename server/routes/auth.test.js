import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hash: vi.fn(async () => "argon2-hash"),
  verify: vi.fn(async () => true),
  createSession: vi.fn(async () => {}),
}));

vi.mock("argon2", () => ({ default: { hash: mocks.hash, verify: mocks.verify, argon2id: 2 } }));
vi.mock("../middleware/auth.js", () => ({
  createSession: mocks.createSession,
  requireAuth: (_req, _res, next) => next(),
  requireRole: () => (_req, _res, next) => next(),
  COOKIE: "lib_sid",
  hashToken: value => value,
}));

const { authRoutes } = await import("./auth.js");

let server;
let baseUrl;

function makeDb({ existingUser = null } = {}) {
  return {
    select: () => ({ from: () => ({ where: async () => existingUser ? [existingUser] : [] }) }),
    insert: () => ({
      values: values => ({
        returning: async () => [{ id: 42, email: values.email, name: values.name, role: values.role }],
      }),
    }),
  };
}

async function request(path, body) {
  return fetch(`${baseUrl}/api/v1/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.hash.mockResolvedValue("argon2-hash");
  mocks.verify.mockResolvedValue(true);
  mocks.createSession.mockResolvedValue(undefined);
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", authRoutes(makeDb()));
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("production authentication routes", () => {
  it("registers a user with an Argon2id hash and creates a session", async () => {
    const response = await request("register", {
      name: "New Reader",
      email: "READER@example.test",
      password: "LongPassword123",
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ user: { id: 42, email: "reader@example.test" } });
    expect(mocks.hash).toHaveBeenCalledWith("LongPassword123", { type: 2 });
    expect(mocks.createSession).toHaveBeenCalledWith(expect.any(Object), 42, expect.any(Object));
  });

  it("rejects invalid registration input with a clear message", async () => {
    const response = await request("register", { name: "Reader", email: "bad", password: "short" });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("valid name and email");
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects an already registered email", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1/auth", authRoutes(makeDb({ existingUser: { id: 7 } })));
    const alternate = app.listen(0, "127.0.0.1");
    await new Promise(resolve => alternate.once("listening", resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${alternate.address().port}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Reader", email: "reader@example.test", password: "LongPassword123" }),
      });
      expect(response.status).toBe(409);
      expect((await response.json()).error).toBe("Email already registered");
      expect(mocks.hash).not.toHaveBeenCalled();
    } finally {
      await new Promise(resolve => alternate.close(resolve));
    }
  });

  it("logs in using the stored password hash and creates a session", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1/auth", authRoutes(makeDb({ existingUser: {
      id: 9, email: "reader@example.test", name: "Reader", role: "user", passwordHash: "stored-hash", suspended: false,
    } })));
    const alternate = app.listen(0, "127.0.0.1");
    await new Promise(resolve => alternate.once("listening", resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${alternate.address().port}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "reader@example.test", password: "LongPassword123" }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ user: { id: 9, email: "reader@example.test" } });
      expect(mocks.verify).toHaveBeenCalledWith("stored-hash", "LongPassword123");
      expect(mocks.createSession).toHaveBeenCalledWith(expect.any(Object), 9, expect.any(Object));
    } finally {
      await new Promise(resolve => alternate.close(resolve));
    }
  });
});
