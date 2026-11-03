import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

let server;

afterEach(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  server = null;
});

describe("shared API error handling", () => {
  it("returns a safe database-unavailable response for book-list query failures", async () => {
    const error = Object.assign(new Error("Failed query: select books"), {
      cause: new Error("All attempts to open a WebSocket to connect to the database failed. Details: TypeError: fetch failed"),
    });
    const query = {
      from() { return this; },
      leftJoin() { return this; },
      where() { return this; },
      orderBy() { return this; },
      limit() { return this; },
      offset() { return Promise.reject(error); },
    };
    const app = createApp({ select: () => query });
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/books?sort=popular&limit=5`);
    expect(response.status).toBe(503);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(await response.json()).toMatchObject({ error: "Database temporarily unavailable. Please try again shortly." });
  });

  it("passes registration database failures through the same safe error handler", async () => {
    const error = Object.assign(new Error("database unavailable"), { code: "ETIMEDOUT" });
    const query = {
      from() { return this; },
      where() { return Promise.reject(error); },
    };
    const app = createApp({ select: () => query });
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "library" },
      body: JSON.stringify({ name: "Reader", email: "reader@example.test", password: "LongPassword123" }),
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: "Database temporarily unavailable. Please try again shortly." });
  });
});
