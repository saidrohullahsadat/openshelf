CREATE TABLE "reader_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"page" integer NOT NULL,
	"label" varchar(120) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reader_bookmarks" ADD CONSTRAINT "reader_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_bookmarks" ADD CONSTRAINT "reader_bookmarks_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reader_bookmarks_user_book_page_unique" ON "reader_bookmarks" USING btree ("user_id","book_id","page");--> statement-breakpoint
CREATE INDEX "reader_bookmarks_user_idx" ON "reader_bookmarks" USING btree ("user_id");