import "dotenv/config";
import { randomUUID } from "node:crypto";

let appPromise;
const loadApp = () => {
  appPromise ||= Promise.all([
    import("../server/db/client.js"),
    import("../server/app.js"),
  ]).then(([{ db }, { createApp }]) => createApp(db)).catch((error) => {
    appPromise = null;
    throw error;
  });
  return appPromise;
};

function startupReason(error) {
  if (!process.env.DATABASE_URL) return "database_url_missing";
  try {
    new URL(process.env.DATABASE_URL);
  } catch {
    return "database_url_invalid";
  }
  if (error?.code === "ERR_MODULE_NOT_FOUND" || error?.code === "MODULE_NOT_FOUND") return "module_load_failed";
  if (error?.code === "ERR_DLOPEN_FAILED") return "native_dependency_load_failed";
  if (["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND"].includes(error?.code)) return "database_connection_failed";
  return "application_initialization_failed";
}

export default async function handler(req, res) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    const requestId = String(req.headers["x-vercel-id"] || randomUUID());
    console.error(JSON.stringify({
      event: "serverless_initialization_error",
      requestId,
      method: req.method,
      path: req.url?.split("?")[0],
      reason: startupReason(error),
      errorName: error?.name || "Error",
      code: error?.code || error?.cause?.code || null,
    }));
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Request-Id", requestId);
    res.end(JSON.stringify({
      error: "Open Shelf service is temporarily unavailable. Please try again shortly.",
      requestId,
    }));
  }
}
