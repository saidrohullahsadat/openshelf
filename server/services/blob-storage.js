import { del, get, put } from "@vercel/blob";
import { Readable } from "node:stream";

export const hasBlobStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function uploadPrivatePdf(buffer, filename) {
  const safeName = String(filename || "book.pdf").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "book.pdf";
  return put(`books/${crypto.randomUUID()}-${safeName}`, buffer, {
    access: "private",
    addRandomSuffix: true,
    contentType: "application/pdf",
    allowOverwrite: false,
  });
}

export async function streamPrivatePdf(pathname, res, { fileName, disposition = "inline" } = {}) {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return false;
  const safeName = String(fileName || "book.pdf").replace(/[\r\n"\\]/g, "_");
  res.status(200)
    .type("application/pdf")
    .set("Cache-Control", "private, no-store")
    .set("X-Content-Type-Options", "nosniff")
    .set("Content-Disposition", `${disposition}; filename="${safeName}"`);
  if (result.blob.size) res.set("Content-Length", String(result.blob.size));
  Readable.fromWeb(result.stream).pipe(res);
  return true;
}

export async function readPrivatePdf(pathname) {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) throw Object.assign(new Error("The original PDF could not be found in private storage"), { status: 404 });
  const chunks = [];
  for await (const chunk of Readable.fromWeb(result.stream)) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function deletePrivatePdf(pathname) {
  if (pathname) await del(pathname, { access: "private" });
}
