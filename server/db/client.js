import { Pool } from "@neondatabase/serverless";
import pg from "pg";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const databaseHost = new URL(process.env.DATABASE_URL).hostname;
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
pool.on("error", (error) => console.error("Database pool error:", error.message));
export const db = useNeonDriver ? drizzleNeon({ client: pool }) : drizzleNode(pool);
