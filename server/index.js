import "dotenv/config";
import { db, pool } from "./db/client.js";
import { createApp } from "./app.js";
const app=createApp(db);
const server=app.listen(Number(process.env.PORT||3000),()=>console.log(`Open Shelf API listening on :${process.env.PORT||3000}`));
const shutdown=()=>server.close(()=>pool.end(()=>process.exit(0)));
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
