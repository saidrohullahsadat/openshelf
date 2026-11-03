import express from "express";
import multer from "multer";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import { loadUser,csrfGuard } from "./middleware/auth.js";
import { authRoutes } from "./routes/auth.js";
import { libraryRoutes } from "./routes/library.js";
const allowedOrigins = new Set(
  [process.env.CORS_ORIGINS, process.env.CLIENT_URL, process.env.APP_URL]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function corsForConfiguredOrigins(req, res, next) {
  const origin = req.get("Origin");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
    res.vary("Origin");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}

export function createApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    next();
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(corsForConfiguredOrigins);
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());
  app.use(csrfGuard);
  app.use(loadUser(db));
  const api = express.Router();
  api.use("/auth", authRoutes(db));
  api.use("/", libraryRoutes(db));
  app.use("/api/v1", api);
  app.get("/health", (_q, res) => res.json({ ok: true }));
  app.use((_q, res) => res.status(404).json({ error: "Not found" }));
  app.use((err, req, res, _next) => {
    const causes = [err, err.cause, err.cause?.cause].filter(Boolean);
    const code = causes.map(error => error.code).find(Boolean);
    const safeMessage = causes.map(error => error.message || "").join(" ").toLowerCase();
    const databaseUnavailable =
      ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "53300", "57P01"].includes(code) ||
      String(code || "").startsWith("08") ||
      safeMessage.includes("websocket to connect to the database failed") ||
      safeMessage.includes("connection terminated due to connection timeout");
    const status = databaseUnavailable ? 503 : err.status || 500;
    console.error(JSON.stringify({
      event: "api_request_error",
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status,
      category: databaseUnavailable ? "database_connection_failed" : "unhandled_api_error",
      error: err.name || "Error",
      code: code || null,
    }));
    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({
        error:
          err.code === "LIMIT_FILE_SIZE"
            ? "PDF exceeds the upload size limit"
            : "Upload could not be processed",
      });
    }
    res.status(status).json({
      error: databaseUnavailable
        ? "Database temporarily unavailable. Please try again shortly."
        : status >= 500
          ? "Internal server error"
          : err.message,
      requestId: req.requestId,
    });
  });
  return app;
}
