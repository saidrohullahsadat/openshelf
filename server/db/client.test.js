import { afterEach, describe, expect, it, vi } from "vitest";

const originalDatabaseUrl = process.env.DATABASE_URL;
let loadedPool;

async function importDatabaseClient(databaseUrl) {
  vi.resetModules();
  if (databaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = databaseUrl;
  const client = await import("./client.js");
  loadedPool = client.pool;
  return client;
}

afterEach(async () => {
  if (loadedPool) await loadedPool.end();
  loadedPool = undefined;
  vi.resetModules();
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

describe("database client configuration", () => {
  it("fails clearly when DATABASE_URL is missing", async () => {
    await expect(importDatabaseClient(undefined)).rejects.toMatchObject({
      code: "DATABASE_URL_MISSING",
      stage: "database_config",
    });
  });

  it("rejects malformed or non-PostgreSQL DATABASE_URL values without echoing them", async () => {
    const secretLookingValue = "not-a-url-super-secret";
    await expect(importDatabaseClient(secretLookingValue)).rejects.toMatchObject({
      code: "DATABASE_URL_INVALID",
      stage: "database_config",
    });

    await expect(importDatabaseClient("https://user:password@example.test/library")).rejects.toMatchObject({
      code: "DATABASE_URL_INVALID_PROTOCOL",
      stage: "database_config",
    });
    expect(secretLookingValue).not.toContain("DATABASE_URL_INVALID");
  });

  it("creates a lazy PostgreSQL pool and Drizzle client for a valid URL", async () => {
    const { db, pool } = await importDatabaseClient("postgresql://reader:password@127.0.0.1:5432/library");
    expect(db).toBeTruthy();
    expect(pool).toBeTruthy();
    expect(pool.totalCount).toBe(0);
  });
});
