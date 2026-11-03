import "dotenv/config";
import { db } from "../server/db/client.js";
import { createApp } from "../server/app.js";

export default createApp(db);
