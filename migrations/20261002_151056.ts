import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Projects Page global copy, plus the Site Settings field rename from the
 * unreleased "profile image" to "brand mark".
 *
 * The rename is written as a guarded RENAME rather than the generated DROP +
 * ADD so that an environment which already ran the earlier unreleased
 * migration keeps its uploaded mark. Databases that never had the old column
 * simply create the new one.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "projects_page" (
    "id" serial PRIMARY KEY NOT NULL,
    "eyebrow" varchar DEFAULT 'Project Archive',
    "heading" varchar DEFAULT 'Projects',
    "description" varchar DEFAULT 'A focused archive of strategy, communications, campaign, and event work. Each entry opens into a text-led project view with the same media and captions used throughout the portfolio.',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'profile_image_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'brand_mark_id') THEN
      ALTER TABLE "site_settings" RENAME COLUMN "profile_image_id" TO "brand_mark_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_profile_image_id_media_id_fk')
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_brand_mark_id_media_id_fk') THEN
      ALTER TABLE "site_settings" RENAME CONSTRAINT "site_settings_profile_image_id_media_id_fk" TO "site_settings_brand_mark_id_media_id_fk";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'site_settings_profile_image_idx')
       AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'site_settings_brand_mark_idx') THEN
      ALTER INDEX "site_settings_profile_image_idx" RENAME TO "site_settings_brand_mark_idx";
    END IF;
  END $$;

  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "brand_mark_id" integer;
  CREATE INDEX IF NOT EXISTS "site_settings_brand_mark_idx" ON "site_settings" USING btree ("brand_mark_id");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_brand_mark_id_media_id_fk') THEN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_mark_id_media_id_fk" FOREIGN KEY ("brand_mark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;

  ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_profile_image_id_media_id_fk";
  DROP INDEX IF EXISTS "site_settings_profile_image_idx";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "profile_image_id";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "projects_page" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "projects_page" CASCADE;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'brand_mark_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_settings' AND column_name = 'profile_image_id') THEN
      ALTER TABLE "site_settings" RENAME COLUMN "brand_mark_id" TO "profile_image_id";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_brand_mark_id_media_id_fk')
       AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_profile_image_id_media_id_fk') THEN
      ALTER TABLE "site_settings" RENAME CONSTRAINT "site_settings_brand_mark_id_media_id_fk" TO "site_settings_profile_image_id_media_id_fk";
    END IF;
  END $$;

  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'site_settings_brand_mark_idx')
       AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'site_settings_profile_image_idx') THEN
      ALTER INDEX "site_settings_brand_mark_idx" RENAME TO "site_settings_profile_image_idx";
    END IF;
  END $$;

  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "profile_image_id" integer;
  CREATE INDEX IF NOT EXISTS "site_settings_profile_image_idx" ON "site_settings" USING btree ("profile_image_id");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_profile_image_id_media_id_fk') THEN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_profile_image_id_media_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  `)
}
