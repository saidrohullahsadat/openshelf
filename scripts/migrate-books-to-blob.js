import "dotenv/config";
import fs from "node:fs";
import { sql } from "drizzle-orm";
import { db, pool } from "../server/db/client.js";
import { books } from "../server/db/schema.js";
import { uploadPrivatePdf } from "../server/services/blob-storage.js";
import { downloadDriveBookBuffer, isDriveFileKey } from "../server/services/google-drive-storage.js";
import { startBookIndexing } from "../server/services/geminiStore.js";

const maximumBytes = Number(process.env.MAX_UPLOAD_MB || 50) * 1024 * 1024;
let migrated = 0;
let failed = 0;

try {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is required");
  const rows = await db.select().from(books).where(sql`${books.blobPathname} is null and ${books.fileKey} is not null`).orderBy(books.id);
  for (const book of rows) {
    try {
      const buffer = isDriveFileKey(book.fileKey)
        ? await downloadDriveBookBuffer(db, book.fileKey)
        : fs.readFileSync(book.fileKey);
      if (buffer.length > maximumBytes || buffer.subarray(0, 5).toString() !== "%PDF-") throw new Error("File is oversized or does not have a PDF signature");
      const blob = await uploadPrivatePdf(buffer, book.fileName || `book-${book.id}.pdf`);
      await db.update(books).set({ blobPathname: blob.pathname, fileSize: buffer.length, fileType: "pdf", updatedAt: new Date() }).where(sql`${books.id} = ${book.id} and ${books.blobPathname} is null`);
      migrated += 1;
      if (book.status === "approved") {
        try { await startBookIndexing(db, book.id, buffer, book.fileName); }
        catch (error) { console.error(`Book ${book.id} copied to Blob; indexing failed: ${error.message}`); }
      }
      console.log(`Migrated book ${book.id} to private Blob`);
    } catch (error) {
      failed += 1;
      console.error(`Book ${book.id} was not migrated: ${error.message}`);
    }
  }
  console.log(`Blob migration complete: ${migrated} migrated, ${failed} failed`);
  if (failed) process.exitCode = 1;
} finally {
  await pool.end();
}
