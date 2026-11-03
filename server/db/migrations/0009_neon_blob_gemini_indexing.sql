ALTER TABLE "books" ADD COLUMN "blob_pathname" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "gemini_document_name" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "gemini_operation_name" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "indexing_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "indexed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "books_indexing_status_idx" ON "books" USING btree ("indexing_status");