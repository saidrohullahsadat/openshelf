ALTER TABLE "books" ADD COLUMN "source_name" varchar(120);--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "online_read_url" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "source_ebook_id" varchar(80);--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "reading_level" varchar(120);--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "attribution" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "source_last_updated" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "external_formats" jsonb DEFAULT '[]'::jsonb NOT NULL;