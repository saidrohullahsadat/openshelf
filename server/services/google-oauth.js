import crypto from "node:crypto";

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
let keySetCache = null;
let keySetExpiresAt = 0;

async function getGoogleKeys(fetcher = fetch) {
  if (keySetCache && Date.now() < keySetExpiresAt) return keySetCache;
  const response = await fetcher(JWKS_URL);
  if (!response.ok) throw new Error("Google signing keys are unavailable");
  const body = await response.json();
  if (!Array.isArray(body.keys)) throw new Error("Google signing keys response was invalid");
  const maxAge = Number(response.headers?.get?.("cache-control")?.match(/max-age=(\d+)/)?.[1] || 3600);
  keySetCache = body.keys;
  keySetExpiresAt = Date.now() + Math.min(maxAge, 86400) * 1000;
  return keySetCache;
}

export async function verifyGoogleIdToken(token, { audience, nonce, nowSeconds = Math.floor(Date.now() / 1000), fetcher = fetch } = {}) {
  if (!audience || !nonce || typeof token !== "string") throw new Error("Google sign-in settings are incomplete");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Google ID token is malformed");
  let header, claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch { throw new Error("Google ID token is malformed"); }
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("Google ID token algorithm is not allowed");
  const keys = await getGoogleKeys(fetcher);
  const jwk = keys.find(key => key.kid === header.kid && key.kty === "RSA" && key.use === "sig");
  if (!jwk) throw new Error("Google signing key was not found");
  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2], "base64url");
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  if (!crypto.verify("RSA-SHA256", signingInput, publicKey, signature)) throw new Error("Google ID token signature is invalid");
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(audience) || (claims.azp && claims.azp !== audience)) throw new Error("Google ID token audience is invalid");
  if (!["https://accounts.google.com", "accounts.google.com"].includes(claims.iss)) throw new Error("Google ID token issuer is invalid");
  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds || typeof claims.iat !== "number" || claims.iat > nowSeconds + 60) throw new Error("Google ID token is expired or not yet valid");
  if (claims.nonce !== nonce) throw new Error("Google ID token nonce is invalid");
  if (claims.email_verified !== true && claims.email_verified !== "true") throw new Error("Google account email is not verified");
  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.email !== "string" || !claims.email) throw new Error("Google account details are incomplete");
  return { sub: claims.sub, email: claims.email.trim().toLowerCase(), name: typeof claims.name === "string" && claims.name.trim() ? claims.name.trim().slice(0, 100) : claims.email.split("@")[0] };
}
