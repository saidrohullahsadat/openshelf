import { afterEach, describe, expect, it, vi } from "vitest";
import { COOKIE, createSession, hashToken } from "./auth.js";

describe("session cookies", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores a hashed session and sets a secure HTTP-only production cookie", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_COOKIE_SAMESITE", "lax");
    const inserted = [];
    const db = { insert: () => ({ values: value => { inserted.push(value); } }) };
    const cookie = vi.fn();

    await createSession(db, 23, { cookie });

    expect(inserted).toHaveLength(1);
    expect(inserted[0].userId).toBe(23);
    expect(inserted[0].tokenHash).toHaveLength(64);
    expect(cookie).toHaveBeenCalledWith(COOKIE, expect.any(String), expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    }));
    expect(inserted[0].tokenHash).toBe(hashToken(cookie.mock.calls[0][1]));
  });
});
