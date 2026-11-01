import "dotenv/config";
import pg from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
try{await migrate(drizzle(pool),{migrationsFolder:"./server/db/migrations"});console.log("Database migrations applied");}finally{await pool.end();}
