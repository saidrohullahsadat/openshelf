import crypto from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { sessions, users } from "../db/schema.js";
export const COOKIE = "lib_sid";
export const hashToken = (t) =>
  crypto.createHash("sha256").update(t).digest("hex");
export async function createSession(db, userId, res) {
  const token = crypto.randomBytes(32).toString("base64url");
  const sameSite = process.env.SESSION_COOKIE_SAMESITE || "lax";
  const expiresAt = new Date(
    Date.now() + Number(process.env.SESSION_DAYS || 14) * 864e5,
  );
  await db
    .insert(sessions)
    .values({ userId, tokenHash: hashToken(token), expiresAt });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    expires: expiresAt,
    path: "/",
  });
}
export const loadUser = (db) => async (req, _res, next) => {
  try {
    const token = req.cookies?.[COOKIE];
    if (token) {
      const [row] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          suspended: users.suspended,
          preferredLanguage: users.preferredLanguage,
          theme: users.theme,
          notifyContributionReviews: users.notifyContributionReviews,
        })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(
          and(
            eq(sessions.tokenHash, hashToken(token)),
            gt(sessions.expiresAt, new Date()),
          ),
        );
      if (row && !row.suspended) req.user = row;
    }
    next();
  } catch (e) {
    next(e);
  }
};
export const requireAuth = (req, res, next) =>
  req.user
    ? next()
    : res.status(401).json({ error: "Authentication required" });
export const requireRole = (role) => (req, res, next) =>
  !req.user
    ? res.status(401).json({ error: "Authentication required" })
    : req.user.role !== role
      ? res.status(403).json({ error: "Forbidden" })
      : next();
export const csrfGuard = (req, res, next) =>
  req.path === "/api/v1/contributions/blob-upload" ||
  ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
  req.get("X-Requested-With") === "library"
    ? next()
    : res.status(403).json({ error: "Missing CSRF header" });
