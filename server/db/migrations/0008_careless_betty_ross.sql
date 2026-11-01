ALTER TABLE "users" ADD COLUMN "daily_download_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "daily_download_date" varchar(10);
--> statement-breakpoint
UPDATE "system_settings"
SET "value" = jsonb_set(
  jsonb_set("value", '{contributionsPerUnlock}', '3'::jsonb, true),
  '{downloadsPerUnlock}',
  '10'::jsonb,
  true
)
WHERE "key" = 'download_policy';
