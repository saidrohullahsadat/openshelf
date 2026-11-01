import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGoogleIdToken } from "./google-oauth.js";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-google-key", kty: "RSA", use: "sig", alg: "RS256" };
const keyFetcher = async () => ({ ok: true, headers: { get: () => "max-age=3600" }, json: async () => ({ keys: [jwk] }) });
const createToken = (overrides = {}) => {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: jwk.kid })).toString("base64url");
  const claims = Buffer.from(JSON.stringify({ iss: "https://accounts.google.com", aud: "client-id", exp: 2000, iat: 1000, nonce: "safe-nonce", sub: "google-sub", email: "Reader@Example.com", email_verified: true, name: "Reader", ...overrides })).toString("base64url");
  const body = `${header}.${claims}`;
  return `${body}.${crypto.sign("RSA-SHA256", Buffer.from(body), privateKey).toString("base64url")}`;
};

describe("verifyGoogleIdToken", () => {
  it("verifies the signature and required identity claims", async () => {
    await expect(verifyGoogleIdToken(createToken(), { audience: "client-id", nonce: "safe-nonce", nowSeconds: 1500, fetcher: keyFetcher })).resolves.toEqual({ sub: "google-sub", email: "reader@example.com", name: "Reader" });
  });

  it("rejects invalid audience, nonce, email verification, and expiry", async () => {
    await expect(verifyGoogleIdToken(createToken({ aud: "another-client" }), { audience: "client-id", nonce: "safe-nonce", nowSeconds: 1500, fetcher: keyFetcher })).rejects.toThrow("audience");
    await expect(verifyGoogleIdToken(createToken(), { audience: "client-id", nonce: "wrong", nowSeconds: 1500, fetcher: keyFetcher })).rejects.toThrow("nonce");
    await expect(verifyGoogleIdToken(createToken({ email_verified: false }), { audience: "client-id", nonce: "safe-nonce", nowSeconds: 1500, fetcher: keyFetcher })).rejects.toThrow("not verified");
    await expect(verifyGoogleIdToken(createToken({ exp: 1200 }), { audience: "client-id", nonce: "safe-nonce", nowSeconds: 1500, fetcher: keyFetcher })).rejects.toThrow("expired");
  });

  it("rejects a modified signature", async () => {
    const token = createToken();
    const modified = `${token.slice(0, -2)}aa`;
    await expect(verifyGoogleIdToken(modified, { audience: "client-id", nonce: "safe-nonce", nowSeconds: 1500, fetcher: keyFetcher })).rejects.toThrow("signature");
  });
});
