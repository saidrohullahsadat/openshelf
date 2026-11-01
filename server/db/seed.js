import "dotenv/config";
import argon2 from "argon2";
import pg from "pg";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { books, categories, settings, users } from "./schema.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

try {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 14) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 14 characters before seeding.");
  }

  const email = process.env.ADMIN_EMAIL.toLowerCase();
  const [admin] = await db.select().from(users).where(eq(users.email, email));
  if (!admin) {
    await db.insert(users).values({
      email,
      name: "Library Administrator",
      passwordHash: await argon2.hash(process.env.ADMIN_PASSWORD, { type: argon2.argon2id }),
      role: "admin",
    });
  }

  const names = [
    "Computer Science", "Programming", "Web Development", "Databases", "Artificial Intelligence",
    "Mathematics", "Physics", "Chemistry", "Biology", "Medicine", "Health & Fitness",
    "History", "Literature", "Poetry", "Drama", "Children’s Books", "Young Adult", "Comics",
    "Business", "Economics", "Finance", "Education", "Languages", "Philosophy", "Psychology",
    "Sociology", "Politics", "Law", "Geography", "Environment", "Agriculture", "Engineering",
    "Architecture", "Art & Design", "Cooking", "Sports", "Travel", "Reference", "Self-help",
    "Islamic Studies", "Religion", "Other",
  ];
  for (const [sortOrder, name] of names.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await db.insert(categories).values({ name, slug, sortOrder }).onConflictDoNothing();
  }

  for (const [key, value] of Object.entries({
    freeDownloads: Number(process.env.FREE_DOWNLOADS || 3),
    contributionsPerUnlock: Number(process.env.CONTRIBUTIONS_PER_UNLOCK || 3),
    downloadsPerUnlock: Number(process.env.DOWNLOADS_PER_UNLOCK || 10),
  })) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing();
  }

  if (process.env.NODE_ENV !== "production") {
    const sampleBooks = [
      { id: "11", title: "Alice’s Adventures in Wonderland", author: "Lewis Carroll", year: 1865, category: "literature", subjects: ["Fantasy", "Children’s stories"], description: "Alice follows a white rabbit into a curious world of wordplay and impossible adventures." },
      { id: "1661", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", year: 1892, category: "literature", subjects: ["Detective and mystery stories", "London"], description: "Twelve stories follow Sherlock Holmes and Dr. Watson as they investigate puzzling cases." },
      { id: "84", title: "Frankenstein; or, The Modern Prometheus", author: "Mary Wollstonecraft Shelley", year: 1818, category: "literature", subjects: ["Science fiction", "Gothic fiction"], description: "Victor Frankenstein’s experiment raises questions about creation, responsibility, and belonging." },
      { id: "35", title: "The Time Machine", author: "H. G. Wells", year: 1895, category: "literature", subjects: ["Science fiction", "Time travel"], description: "A Victorian inventor travels far into the future and encounters a changed humanity." },
      { id: "98", title: "A Tale of Two Cities", author: "Charles Dickens", year: 1859, category: "history", subjects: ["French Revolution", "Historical fiction"], description: "A story of sacrifice and family set in London and Paris during the French Revolution." },
      { id: "2701", title: "Moby-Dick; or, The Whale", author: "Herman Melville", year: 1851, category: "literature", subjects: ["Sea stories", "Whaling"], description: "Ishmael joins Captain Ahab’s obsessive voyage in pursuit of the white whale." },
      { id: "1228", title: "On the Origin of Species", author: "Charles Darwin", year: 1859, category: "biology", subjects: ["Evolution", "Natural selection"], description: "Charles Darwin presents his observations and argument about natural selection." },
      { id: "132", title: "The Art of War", author: "Sunzi", year: -500, category: "history", subjects: ["Military science", "Strategy"], description: "An influential classical Chinese treatise on strategy, translated into English by Lionel Giles." },
      { id: "1232", title: "The Prince", author: "Niccolò Machiavelli", year: 1532, category: "history", subjects: ["Political science", "Political ethics"], description: "A political treatise examining power, statecraft, and the conduct of rulers." },
      { id: "7440", title: "The Koran (Al-Qur’an)", author: "Translated by George Sale", year: 1734, category: "religion", subjects: ["Qur’an", "Islam"], language: "English", description: "An early English translation of the Qur’an, hosted by Project Gutenberg. This is a historical translation, not a Pashto or Dari edition." },
    ];
    for (const sample of sampleBooks) {
      const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, sample.category));
      const coverUrl = `https://www.gutenberg.org/cache/epub/${sample.id}/pg${sample.id}.cover.medium.jpg`;
      const [exists] = await db.select({ id: books.id }).from(books).where(eq(books.sourceEbookId, sample.id));
      if (exists) {
        await db.update(books).set({ coverUrl, categoryId: category?.id }).where(eq(books.id, exists.id));
        continue;
      }
      const sourceUrl = `https://www.gutenberg.org/ebooks/${sample.id}`;
      await db.insert(books).values({
        title: sample.title, author: sample.author, publicationYear: sample.year > 0 ? sample.year : null,
        categoryId: category?.id, subjects: sample.subjects, description: sample.description,
        coverUrl,
        language: sample.language || "English", license: "Project Gutenberg edition; public domain in the USA. Check local rights before redistribution.",
        sourceName: "Project Gutenberg", sourceUrl, onlineReadUrl: sourceUrl, sourceEbookId: sample.id,
        externalFormats: [
          { label: "Plain text", format: "TXT", url: `https://www.gutenberg.org/ebooks/${sample.id}.txt.utf-8` },
          { label: "EPUB", format: "EPUB", url: `https://www.gutenberg.org/ebooks/${sample.id}.epub.images` },
        ],
        status: "approved",
      });
    }

    const [existing] = await db.select({ id: books.id }).from(books).where(eq(books.sourceEbookId, "1342"));
    if (!existing) {
      const [literature] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, "literature"));
      await db.insert(books).values({
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "Elizabeth Bennet learns to see past first impressions and hasty judgments as her family faces pressure to marry well. Project Gutenberg edition with illustrations and reading options.",
        categoryId: literature?.id,
        subjects: ["England -- Fiction", "Young women -- Fiction", "Love stories", "Sisters -- Fiction", "Domestic fiction", "Courtship", "Social classes"],
        isbn: "979-8-238-01342-8",
        language: "English",
        publicationYear: 1813,
        coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
        license: "Public domain in the USA. Check the laws in your country before redistributing.",
        sourceName: "Project Gutenberg",
        sourceUrl: "https://www.gutenberg.org/ebooks/1342",
        onlineReadUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342-images.html",
        sourceEbookId: "1342",
        readingLevel: "Reading ease score: 69.2 (8th and 9th grade)",
        attribution: "Credits: Chuck Greif and the Online Distributed Proofreading Team.",
        sourceLastUpdated: new Date("2026-09-29T00:00:00Z"),
        externalFormats: [
          { label: "EPUB3 with images", format: "EPUB3", size: "23.7 MB", url: "https://www.gutenberg.org/ebooks/1342.epub3.images", recommended: true },
          { label: "Plain text", format: "TXT", size: "754 kB", url: "https://www.gutenberg.org/ebooks/1342.txt.utf-8" },
          { label: "EPUB for older readers", format: "EPUB", size: "23.7 MB", url: "https://www.gutenberg.org/ebooks/1342.epub.images" },
          { label: "EPUB without images", format: "EPUB", size: "548 kB", url: "https://www.gutenberg.org/ebooks/1342.epub.noimages" },
          { label: "Kindle KF8", format: "AZW3", size: "24.2 MB", url: "https://www.gutenberg.org/ebooks/1342.kf8.images" },
          { label: "Older Kindle", format: "MOBI", size: "24.1 MB", url: "https://www.gutenberg.org/ebooks/1342.kindle.images" },
          { label: "HTML archive", format: "ZIP", size: "24.1 MB", url: "https://www.gutenberg.org/cache/epub/1342/pg1342-h.zip" },
        ],
        status: "approved",
      });
    }
  }

  console.log("Development administrator, categories, and sample book are ready.");
} finally {
  await pool.end();
}
