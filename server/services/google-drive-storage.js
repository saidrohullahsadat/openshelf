import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { settings } from "../db/schema.js";

const SETTINGS_KEY = "google_drive_storage";
const FOLDER_NAME = "Open Shelf Library";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function encryptionKey() {
  const encoded = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY || "";
  const key = Buffer.from(encoded, "base64");
  if (!encoded || key.length !== 32) {
    throw Object.assign(
      new Error("Google Drive token encryption key is not configured"),
      { status: 503 },
    );
  }
  return key;
}

function encryptToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptToken(value) {
  const [ivValue, tagValue, encryptedValue] = String(value || "").split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Google Drive token data is invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export const hasDriveEncryptionKey = () => {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
};

async function readConnection(db) {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, SETTINGS_KEY));
  return row?.value || null;
}

export async function getDriveStorageStatus(db) {
  const connection = await readConnection(db);
  return {
    connected: !!(connection?.encryptedRefreshToken && connection?.folderId),
    email: connection?.email || null,
    folderName: connection?.folderName || FOLDER_NAME,
    connectedAt: connection?.connectedAt || null,
    encryptionKeyConfigured: hasDriveEncryptionKey(),
    oauthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  };
}

export async function isDriveStorageConnected(db) {
  const status = await getDriveStorageStatus(db);
  return status.connected;
}

export async function saveDriveConnection(db, { refreshToken, folderId, email }) {
  const value = {
    encryptedRefreshToken: encryptToken(refreshToken),
    folderId,
    folderName: FOLDER_NAME,
    email,
    connectedAt: new Date().toISOString(),
  };
  await db
    .insert(settings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
  return getDriveStorageStatus(db);
}

async function connectionWithAccessToken(db) {
  const connection = await readConnection(db);
  if (!connection?.encryptedRefreshToken || !connection.folderId) {
    throw Object.assign(new Error("Google Drive has not been connected by an administrator"), { status: 503 });
  }
  const refreshToken = decryptToken(connection.encryptedRefreshToken);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    redirect: "error",
  });
  if (!response.ok) {
    throw Object.assign(new Error("Google Drive access could not be refreshed; reconnect the Drive account"), { status: 502 });
  }
  const tokens = await response.json();
  if (typeof tokens.access_token !== "string") {
    throw Object.assign(new Error("Google Drive did not return an access token"), { status: 502 });
  }
  return { connection, accessToken: tokens.access_token };
}

export async function createDriveBookFolder(accessToken) {
  const response = await fetch(`${DRIVE_FILES_URL}?fields=id,name`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Could not create the Google Drive library folder (${response.status})`);
  const folder = await response.json();
  if (typeof folder.id !== "string") throw new Error("Google Drive did not return a folder ID");
  return folder;
}

export async function uploadDriveBook(db, localPath, fileName) {
  const { connection, accessToken } = await connectionWithAccessToken(db);
  const size = fs.statSync(localPath).size;
  const safeName = path.basename(fileName || "book.pdf").replace(/[\r\n"]/g, "_").slice(0, 180) || "book.pdf";
  const init = await fetch(`${UPLOAD_URL}?uploadType=resumable&fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "application/pdf",
      "X-Upload-Content-Length": String(size),
    },
    body: JSON.stringify({ name: safeName, parents: [connection.folderId], mimeType: "application/pdf" }),
    redirect: "error",
  });
  const uploadUrl = init.headers.get("location");
  if (!init.ok || !uploadUrl) throw new Error(`Could not start the Google Drive upload (${init.status})`);
  const uploaded = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf", "Content-Length": String(size) },
    body: fs.createReadStream(localPath),
    duplex: "half",
    redirect: "error",
  });
  if (!uploaded.ok) throw new Error(`Google Drive could not save the PDF (${uploaded.status})`);
  const metadata = await uploaded.json();
  if (typeof metadata.id !== "string") throw new Error("Google Drive did not return the saved file ID");
  return metadata.id;
}

export const isDriveFileKey = (fileKey) => typeof fileKey === "string" && fileKey.startsWith("gdrive:");

export async function downloadDriveBookBuffer(db, fileKey) {
  if (!isDriveFileKey(fileKey)) throw new Error("Google Drive file key is invalid");
  const id = fileKey.slice("gdrive:".length);
  const { accessToken } = await connectionWithAccessToken(db);
  const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(id)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: "error",
  });
  if (!response.ok) throw Object.assign(new Error(`Google Drive could not return the PDF (${response.status})`), { status: response.status === 404 ? 404 : 502 });
  return Buffer.from(await response.arrayBuffer());
}

export async function streamDriveBook(db, fileKey, res, { fileName, disposition = "attachment" } = {}) {
  if (!isDriveFileKey(fileKey)) throw new Error("Google Drive file key is invalid");
  const id = fileKey.slice("gdrive:".length);
  const { accessToken } = await connectionWithAccessToken(db);
  const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(id)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: "error",
  });
  if (!response.ok || !response.body) {
    throw Object.assign(new Error(`Google Drive could not return the PDF (${response.status})`), { status: response.status === 404 ? 404 : 502 });
  }
  const safeName = path.basename(fileName || "book.pdf").replace(/[\r\n"]/g, "_");
  res.status(200).type("application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(path.basename(fileName || "book.pdf"))}`);
  res.setHeader("Cache-Control", "private, no-store");
  const stream = Readable.fromWeb(response.body);
  stream.on("error", (error) => res.destroy(error));
  stream.pipe(res);
}

export async function deleteDriveBook(db, fileKey) {
  if (!isDriveFileKey(fileKey)) return;
  const { accessToken } = await connectionWithAccessToken(db);
  const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(fileKey.slice("gdrive:".length))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: "error",
  });
  if (!response.ok && response.status !== 404) throw new Error(`Could not remove the unused Google Drive file (${response.status})`);
}
