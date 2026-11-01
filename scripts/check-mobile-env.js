import dotenv from "dotenv";
import { existsSync, readFileSync } from "node:fs";

const envPath = ".env.mobile";
if (!existsSync(envPath)) {
  console.error("Copy .env.mobile.example to .env.mobile and set VITE_API_BASE to your public HTTPS API URL.");
  process.exit(1);
}

const mobileEnv = dotenv.parse(readFileSync(envPath));
const apiBase = mobileEnv.VITE_API_BASE || process.env.VITE_API_BASE;
try {
  const url = new URL(apiBase);
  if (url.protocol !== "https:" || /example\.com$/i.test(url.hostname) || !url.pathname.endsWith("/api/v1")) {
    throw new Error();
  }
} catch {
  console.error("VITE_API_BASE must be a real HTTPS API URL ending in /api/v1.");
  process.exit(1);
}
