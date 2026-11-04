import { Pool } from "@neondatabase/serverless";
import pg from "pg";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";

function validateDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    const error = new Error("DATABASE_URL is required to start OpenShelf");
    error.code = "DATABASE_URL_MISSING";
    error.stage = "database_config";
    throw error;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    const wrapped = new Error("DATABASE_URL is not a valid PostgreSQL connection URL");
    wrapped.code = "DATABASE_URL_INVALID";
    wrapped.stage = "database_config";
    wrapped.cause = error;
    throw wrapped;
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    const error = new Error("DATABASE_URL must use a PostgreSQL scheme");
    error.code = "DATABASE_URL_INVALID_PROTOCOL";
    error.stage = "database_config";
    throw error;
  }

  return parsed.hostname;
}

const databaseHost = validateDatabaseUrl(process.env.DATABASE_URL);
const useNeonDriver = databaseHost.endsWith(".neon.tech");

export const pool = useNeonDriver
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
    })
  : new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
    });

pool.on("error", (error) => {
  console.error(JSON.stringify({
    event: "database_pool_error",
    stage: "database_runtime",
    errorName: error?.name || "Error",
    code: error?.code || null,
  }));
});

export const db = useNeonDriver ? drizzleNeon({ client: pool }) : drizzleNode(pool);
