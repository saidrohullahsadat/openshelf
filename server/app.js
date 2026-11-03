import express from "express";
import multer from "multer";
import helmet from "helmet";
import cookieParser from "cookie-parser";
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
  app.use((err, _q, res, _next) => {
    console.error(err.message);
    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({
        error:
          err.code === "LIMIT_FILE_SIZE"
            ? "PDF exceeds the upload size limit"
            : "Upload could not be processed",
      });
    }
    res.status(err.status || 500).json({
      error: err.status ? err.message : "Internal server error",
    });
  });
  return app;
}
