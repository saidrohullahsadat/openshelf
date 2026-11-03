import { GoogleGenAI, UploadToFileSearchStoreOperation } from "@google/genai";
import { and, eq, inArray, sql } from "drizzle-orm";
import { books, settings } from "../db/schema.js";

const STORE_SETTING = "gemini_file_search_store_name";
const INDEXABLE = new Set(["pending", "failed"]);
let client;
const ai = () => {
  if (!process.env.GEMINI_API_KEY) throw Object.assign(new Error("Gemini is not configured"), { status: 503 });
  return (client ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
};

export async function getStoreName(db) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(771092410)`);
    const [saved] = await tx.select({ value: settings.value }).from(settings).where(eq(settings.key, STORE_SETTING));
    const candidates = [...new Set([process.env.GEMINI_FILE_SEARCH_STORE_NAME, saved?.value?.name].filter(Boolean))];
    for (const name of candidates) {
      try {
        const store = await ai().fileSearchStores.get({ name });
        if (store?.name) { await saveStore(tx, store.name); return store.name; }
      } catch { /* A stale configured or saved store can be recovered below. */ }
    }
    const stores = await ai().fileSearchStores.list({ config: { pageSize: 20 } });
    for await (const store of stores) {
      if (store.displayName === "OpenShelf") {
        await saveStore(tx, store.name);
        return store.name;
      }
    }
    const created = await ai().fileSearchStores.create({ config: { displayName: "OpenShelf", embeddingModel: "models/gemini-embedding-2" } });
    if (!created.name) throw new Error("Gemini created a store without returning its name");
    await saveStore(tx, created.name);
    return created.name;
  });
}

async function saveStore(db, name) {
  await db.insert(settings).values({ key: STORE_SETTING, value: { name } }).onConflictDoUpdate({ target: settings.key, set: { value: { name } } });
}

export async function startBookIndexing(db, bookId, buffer, filename) {
  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) throw Object.assign(new Error("Book not found"), { status: 404 });
  if (!INDEXABLE.has(book.indexingStatus)) return { status: book.indexingStatus, operationName: book.geminiOperationName };
  if (!book.blobPathname && !book.fileKey) throw new Error("The original PDF is unavailable for indexing");
  const [claimed] = await db.update(books).set({ indexingStatus: "processing", indexingError: null, geminiOperationName: null }).where(and(eq(books.id, bookId), inArray(books.indexingStatus, [...INDEXABLE]))).returning({ id: books.id });
  if (!claimed) {
    const [current] = await db.select({ indexingStatus: books.indexingStatus, geminiOperationName: books.geminiOperationName }).from(books).where(eq(books.id, bookId));
    return { status: current?.indexingStatus || "failed", operationName: current?.geminiOperationName || null };
  }
  try {
    const file = new File([buffer], filename || `book-${bookId}.pdf`, { type: "application/pdf" });
    const operation = await ai().fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: await getStoreName(db), file,
      config: { displayName: `book-${bookId}.pdf`, mimeType: "application/pdf", customMetadata: [{ key: "bookId", stringValue: String(bookId) }] },
    });
    if (!operation.name) throw new Error("Gemini did not return an indexing operation name");
    await db.update(books).set({ indexingStatus: "processing", geminiOperationName: operation.name }).where(eq(books.id, bookId));
    return { status: "processing", operationName: operation.name };
  } catch (error) {
    await db.update(books).set({ indexingStatus: "failed", indexingError: String(error.message || "Gemini indexing failed").slice(0, 2000), geminiOperationName: null }).where(eq(books.id, bookId));
    throw error;
  }
}

export async function refreshIndexingStatuses(db, ids) {
  if (!process.env.GEMINI_API_KEY) return;
  const rows = await db.select().from(books).where(ids ? inArray(books.id, ids) : eq(books.indexingStatus, "processing"));
  for (const book of rows) {
    if (book.indexingStatus !== "processing" || !book.geminiOperationName) continue;
    try {
      const pendingOperation = new UploadToFileSearchStoreOperation();
      pendingOperation.name = book.geminiOperationName;
      const operation = await ai().operations.get({ operation: pendingOperation });
      if (!operation.done) continue;
      await db.update(books).set({ indexingStatus: operation.error ? "failed" : "indexed", indexingError: operation.error ? JSON.stringify(operation.error).slice(0, 2000) : null, indexedAt: operation.error ? null : new Date(), geminiDocumentName: operation.error ? null : operation.response?.documentName || null }).where(eq(books.id, book.id));
    } catch (error) {
      console.error("Gemini indexing status check failed for book", book.id, error.message);
    }
  }
}

export async function askBooks(db, prompt) {
  const [{ count }] = await db.select({ count: sql`count(*)::int` }).from(books).where(eq(books.indexingStatus, "indexed"));
  if (!count) throw Object.assign(new Error("No books have finished indexing yet. Try again after indexing completes."), { status: 503 });
  try {
    const storeName = await getStoreName(db);
    const response = await ai().models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ fileSearch: { fileSearchStoreNames: [storeName], topK: 8 } }] },
    });
    if (!response.text) throw new Error("Gemini returned an empty answer");
    return { answer: response.text, grounding: response.candidates?.[0]?.groundingMetadata || null };
  } catch (error) {
    if (error.status) throw error;
    console.error("Gemini book search failed:", error.message);
    throw Object.assign(new Error("AI search is temporarily unavailable. Please try again shortly."), { status: 503 });
  }
}

