import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio stabilization schema (media metadata, Project/Article versions and
 * draft status, Home Page and Site Settings globals, redirects, folders).
 *
 * This migration must run against databases in three different states:
 *
 *   1. a fresh database, where it creates everything;
 *   2. a database created by the earlier checked-in migrations, where it adds
 *      the newer tables and columns;
 *   3. a database where Payload's dev-time schema push already created some
 *      objects (typically the Site Settings global), where it must add only the
 *      pieces that are still missing.
 *
 * Because of (3) every statement is written to be idempotent: tables, columns,
 * indexes and types use IF NOT EXISTS or a duplicate-object guard, and foreign
 * keys are checked against pg_constraint first. Existing content is never
 * recreated or dropped, and the legacy status backfills only run when the draft
 * status column is genuinely new so that re-running cannot republish drafts.
 */

const requiredTables = [
  "_articles_v",
  "_articles_v_rels",
  "_home_page_v",
  "_projects_v",
  "_projects_v_rels",
  "home_page",
  "media_tags",
  "payload_folders",
  "redirects",
]

const requiredColumns: [string, string][] = [
  ["articles", "_status"],
  ["articles", "body"],
  ["media", "folder"],
  ["media", "sizes_gallery_filename"],
  ["media", "sizes_og_filename"],
  ["media", "usage"],
  ["projects", "_status"],
  ["projects", "content"],
  ["projects", "published_at"],
  ["site_settings", "profile_image_id"],
]

/**
 * Fails loudly instead of leaving a half-upgraded database behind if a database
 * drifted in a way the guarded DDL above could not repair.
 */
const assertStabilizedSchema = async (db: MigrateUpArgs["db"]) => {
  const missing: string[] = []

  for (const table of requiredTables) {
    const result = await db.execute(sql`SELECT to_regclass(${`public.${table}`}) IS NOT NULL AS present`)
    if (!result.rows[0]?.present) {
      missing.push(`table ${table}`)
    }
  }

  for (const [table, column] of requiredColumns) {
    const result = await db.execute(
      sql`SELECT 1 FROM information_schema.columns WHERE table_name = ${table} AND column_name = ${column}`,
    )
    if (result.rows.length === 0) {
      missing.push(`column ${table}.${column}`)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Stabilization migration produced an incomplete schema: ${missing.join(", ")}`)
  }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Recorded before the DDL below runs: legacy rows must be marked as published
  // exactly once, when the draft status column is introduced.
  const previousSchema = await db.execute(sql`
    SELECT
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = '_status') AS projects_had_status,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = '_status') AS articles_had_status
  `)

  await db.execute(sql`
   DO $$ BEGIN
     CREATE TYPE "public"."enum_media_folder" AS ENUM('portfolio', 'homepage', 'article', 'brand', 'archive');
   EXCEPTION WHEN duplicate_object THEN NULL;
   END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_media_usage" AS ENUM('project', 'article', 'profile', 'site', 'archive');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_redirects_type" AS ENUM('301', '302', '307', '308');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_home_page_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__home_page_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE TABLE IF NOT EXISTS "media_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "_projects_v_version_details_approach" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_projects_v_version_details_implementation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_projects_v_version_details_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" jsonb,
  	"version_category" varchar,
  	"version_year" varchar,
  	"version_role" varchar,
  	"version_client" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_published_at" timestamp(3) with time zone,
  	"version_thumbnail_id" integer,
  	"version_details_introduction" varchar,
  	"version_details_objective" varchar,
  	"version_details_takeaway" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical_url" varchar,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );

  CREATE TABLE IF NOT EXISTS "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" varchar,
  	"version_content" varchar,
  	"version_body" jsonb,
  	"version_featured_image_id" integer,
  	"version_status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_image_id" integer,
  	"version_seo_canonical_url" varchar,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );

  CREATE TABLE IF NOT EXISTS "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );

  CREATE TABLE IF NOT EXISTS "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"type" "enum_redirects_type" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer,
  	"articles_id" integer
  );

  CREATE TABLE IF NOT EXISTS "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );

  CREATE TABLE IF NOT EXISTS "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"payload_folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fallback_to_featured" boolean DEFAULT true,
  	"_status" "enum_home_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE IF NOT EXISTS "home_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );

  CREATE TABLE IF NOT EXISTS "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_fallback_to_featured" boolean DEFAULT true,
  	"version__status" "enum__home_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );

  CREATE TABLE IF NOT EXISTS "_home_page_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"projects_id" integer
  );

  CREATE TABLE IF NOT EXISTS "site_settings_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "site_settings_navigation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"open_in_new_tab" boolean DEFAULT false
  );

  CREATE TABLE IF NOT EXISTS "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"owner_name" varchar NOT NULL,
  	"site_name" varchar NOT NULL,
  	"profile_image_id" integer,
  	"description" varchar,
  	"email" varchar,
  	"location" varchar,
  	"default_s_e_o_title" varchar,
  	"default_s_e_o_description" varchar,
  	"default_s_e_o_image_id" integer,
  	"default_s_e_o_site_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "projects_details_approach" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "projects_details_implementation" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "projects_details_outcomes" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "description" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "category" DROP NOT NULL;
  ALTER TABLE "projects" ALTER COLUMN "year" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "description" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "content" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "status" DROP NOT NULL;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "folder" "enum_media_folder" DEFAULT 'portfolio';
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "usage" "enum_media_usage" DEFAULT 'project';
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "credit" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "payload_folder_id" integer;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_gallery_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_gallery_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_gallery_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_gallery_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_gallery_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_gallery_filename" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_detail_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_detail_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_detail_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_detail_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_detail_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_detail_filename" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_lightbox_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_lightbox_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_lightbox_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_lightbox_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_lightbox_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_lightbox_filename" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_url" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_width" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_height" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filename" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "content" jsonb;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_description" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_image_id" integer;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "meta_no_index" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "seo_title" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "seo_description" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "seo_image_id" integer;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "seo_canonical_url" varchar;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "seo_no_index" boolean DEFAULT false;
  ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "_status" "enum_projects_status" DEFAULT 'draft';
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "body" jsonb;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "seo_title" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "seo_description" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "seo_image_id" integer;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "seo_canonical_url" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "seo_no_index" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_description" varchar;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_image_id" integer;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_no_index" boolean DEFAULT false;
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "_status" "enum_articles_status" DEFAULT 'draft';
  -- Preserve publication of records created before drafts were introduced.
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "redirects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "payload_folders_id" integer;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."media_tags"'::regclass AND conname = 'media_tags_parent_id_fk') THEN
      ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v_version_details_approach"'::regclass AND conname = '_projects_v_version_details_approach_parent_id_fk') THEN
      ALTER TABLE "_projects_v_version_details_approach" ADD CONSTRAINT "_projects_v_version_details_approach_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v_version_details_implementation"'::regclass AND conname = '_projects_v_version_details_implementation_parent_id_fk') THEN
      ALTER TABLE "_projects_v_version_details_implementation" ADD CONSTRAINT "_projects_v_version_details_implementation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v_version_details_outcomes"'::regclass AND conname = '_projects_v_version_details_outcomes_parent_id_fk') THEN
      ALTER TABLE "_projects_v_version_details_outcomes" ADD CONSTRAINT "_projects_v_version_details_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v"'::regclass AND conname = '_projects_v_parent_id_projects_id_fk') THEN
      ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v"'::regclass AND conname = '_projects_v_version_thumbnail_id_media_id_fk') THEN
      ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v"'::regclass AND conname = '_projects_v_version_meta_image_id_media_id_fk') THEN
      ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v"'::regclass AND conname = '_projects_v_version_seo_image_id_media_id_fk') THEN
      ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v_rels"'::regclass AND conname = '_projects_v_rels_parent_fk') THEN
      ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_projects_v_rels"'::regclass AND conname = '_projects_v_rels_media_fk') THEN
      ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_articles_v"'::regclass AND conname = '_articles_v_parent_id_articles_id_fk') THEN
      ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_articles_v"'::regclass AND conname = '_articles_v_version_featured_image_id_media_id_fk') THEN
      ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_articles_v"'::regclass AND conname = '_articles_v_version_seo_image_id_media_id_fk') THEN
      ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_articles_v"'::regclass AND conname = '_articles_v_version_meta_image_id_media_id_fk') THEN
      ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_articles_v_rels"'::regclass AND conname = '_articles_v_rels_parent_fk') THEN
      ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_articles_v_rels"'::regclass AND conname = '_articles_v_rels_media_fk') THEN
      ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."redirects_rels"'::regclass AND conname = 'redirects_rels_parent_fk') THEN
      ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."redirects_rels"'::regclass AND conname = 'redirects_rels_projects_fk') THEN
      ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."redirects_rels"'::regclass AND conname = 'redirects_rels_articles_fk') THEN
      ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."payload_jobs_log"'::regclass AND conname = 'payload_jobs_log_parent_id_fk') THEN
      ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."payload_folders_folder_type"'::regclass AND conname = 'payload_folders_folder_type_parent_fk') THEN
      ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."payload_folders"'::regclass AND conname = 'payload_folders_payload_folder_id_payload_folders_id_fk') THEN
      ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_payload_folder_id_payload_folders_id_fk" FOREIGN KEY ("payload_folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."home_page_rels"'::regclass AND conname = 'home_page_rels_parent_fk') THEN
      ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."home_page_rels"'::regclass AND conname = 'home_page_rels_projects_fk') THEN
      ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_home_page_v_rels"'::regclass AND conname = '_home_page_v_rels_parent_fk') THEN
      ALTER TABLE "_home_page_v_rels" ADD CONSTRAINT "_home_page_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."_home_page_v_rels"'::regclass AND conname = '_home_page_v_rels_projects_fk') THEN
      ALTER TABLE "_home_page_v_rels" ADD CONSTRAINT "_home_page_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings_services"'::regclass AND conname = 'site_settings_services_parent_id_fk') THEN
      ALTER TABLE "site_settings_services" ADD CONSTRAINT "site_settings_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings_socials"'::regclass AND conname = 'site_settings_socials_parent_id_fk') THEN
      ALTER TABLE "site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings_navigation"'::regclass AND conname = 'site_settings_navigation_parent_id_fk') THEN
      ALTER TABLE "site_settings_navigation" ADD CONSTRAINT "site_settings_navigation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "media_tags_order_idx" ON "media_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "media_tags_parent_id_idx" ON "media_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_details_approach_order_idx" ON "_projects_v_version_details_approach" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_details_approach_parent_id_idx" ON "_projects_v_version_details_approach" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_details_implementation_order_idx" ON "_projects_v_version_details_implementation" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_details_implementation_parent_id_idx" ON "_projects_v_version_details_implementation" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_details_outcomes_order_idx" ON "_projects_v_version_details_outcomes" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_details_outcomes_parent_id_idx" ON "_projects_v_version_details_outcomes" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_category_idx" ON "_projects_v" USING btree ("version_category");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_featured_idx" ON "_projects_v" USING btree ("version_featured");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_thumbnail_idx" ON "_projects_v" USING btree ("version_thumbnail_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_meta_version_meta_image_idx" ON "_projects_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_seo_version_seo_image_idx" ON "_projects_v" USING btree ("version_seo_image_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_projects_v_autosave_idx" ON "_projects_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_projects_v_rels_media_id_idx" ON "_projects_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_version_featured_image_idx" ON "_articles_v" USING btree ("version_featured_image_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_seo_version_seo_image_idx" ON "_articles_v" USING btree ("version_seo_image_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_meta_version_meta_image_idx" ON "_articles_v" USING btree ("version_meta_image_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_articles_v_rels_media_id_idx" ON "_articles_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX IF NOT EXISTS "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "redirects_rels_projects_id_idx" ON "redirects_rels" USING btree ("projects_id");
  CREATE INDEX IF NOT EXISTS "redirects_rels_articles_id_idx" ON "redirects_rels" USING btree ("articles_id");
  CREATE INDEX IF NOT EXISTS "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX IF NOT EXISTS "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX IF NOT EXISTS "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX IF NOT EXISTS "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX IF NOT EXISTS "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX IF NOT EXISTS "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX IF NOT EXISTS "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX IF NOT EXISTS "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "payload_folders_payload_folder_idx" ON "payload_folders" USING btree ("payload_folder_id");
  CREATE INDEX IF NOT EXISTS "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "home_page__status_idx" ON "home_page" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "home_page_rels_order_idx" ON "home_page_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "home_page_rels_parent_idx" ON "home_page_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "home_page_rels_path_idx" ON "home_page_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "home_page_rels_projects_id_idx" ON "home_page_rels" USING btree ("projects_id");
  CREATE INDEX IF NOT EXISTS "_home_page_v_version_version__status_idx" ON "_home_page_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_home_page_v_latest_idx" ON "_home_page_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_home_page_v_autosave_idx" ON "_home_page_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_home_page_v_rels_order_idx" ON "_home_page_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_home_page_v_rels_parent_idx" ON "_home_page_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_home_page_v_rels_path_idx" ON "_home_page_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_home_page_v_rels_projects_id_idx" ON "_home_page_v_rels" USING btree ("projects_id");
  CREATE INDEX IF NOT EXISTS "site_settings_services_order_idx" ON "site_settings_services" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_settings_services_parent_id_idx" ON "site_settings_services" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_settings_socials_order_idx" ON "site_settings_socials" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_settings_socials_parent_id_idx" ON "site_settings_socials" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "site_settings_navigation_order_idx" ON "site_settings_navigation" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "site_settings_navigation_parent_id_idx" ON "site_settings_navigation" USING btree ("_parent_id");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."media"'::regclass AND conname = 'media_payload_folder_id_payload_folders_id_fk') THEN
      ALTER TABLE "media" ADD CONSTRAINT "media_payload_folder_id_payload_folders_id_fk" FOREIGN KEY ("payload_folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."projects"'::regclass AND conname = 'projects_meta_image_id_media_id_fk') THEN
      ALTER TABLE "projects" ADD CONSTRAINT "projects_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."projects"'::regclass AND conname = 'projects_seo_image_id_media_id_fk') THEN
      ALTER TABLE "projects" ADD CONSTRAINT "projects_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."articles"'::regclass AND conname = 'articles_seo_image_id_media_id_fk') THEN
      ALTER TABLE "articles" ADD CONSTRAINT "articles_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."articles"'::regclass AND conname = 'articles_meta_image_id_media_id_fk') THEN
      ALTER TABLE "articles" ADD CONSTRAINT "articles_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."payload_locked_documents_rels"'::regclass AND conname = 'payload_locked_documents_rels_redirects_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."payload_locked_documents_rels"'::regclass AND conname = 'payload_locked_documents_rels_payload_folders_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "media_payload_folder_idx" ON "media" USING btree ("payload_folder_id");
  CREATE INDEX IF NOT EXISTS "media_sizes_gallery_sizes_gallery_filename_idx" ON "media" USING btree ("sizes_gallery_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_detail_sizes_detail_filename_idx" ON "media" USING btree ("sizes_detail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_lightbox_sizes_lightbox_filename_idx" ON "media" USING btree ("sizes_lightbox_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX IF NOT EXISTS "projects_meta_meta_image_idx" ON "projects" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "projects_seo_seo_image_idx" ON "projects" USING btree ("seo_image_id");
  CREATE INDEX IF NOT EXISTS "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "articles_seo_seo_image_idx" ON "articles" USING btree ("seo_image_id");
  CREATE INDEX IF NOT EXISTS "articles_meta_meta_image_idx" ON "articles" USING btree ("meta_image_id");
  CREATE INDEX IF NOT EXISTS "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  `)

  if (!previousSchema.rows[0]?.projects_had_status) {
    await db.execute(sql`UPDATE "projects" SET "_status" = 'published' WHERE "_status" = 'draft'`)
  }

  if (!previousSchema.rows[0]?.articles_had_status) {
    await db.execute(sql`UPDATE "articles" SET "_status" = "status" WHERE "status" IS NOT NULL`)
  }

  await db.execute(sql`
    -- Site Settings can already exist when a database was created by an earlier
    -- Payload dev schema push. In that case the CREATE TABLE IF NOT EXISTS above was
    -- skipped and these columns are still missing, so top them up explicitly. The
    -- index and foreign keys for these columns live here too, because they must run
    -- after the columns exist rather than with the rest of the baseline DDL.
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "profile_image_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "description" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "email" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "location" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_s_e_o_title" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_s_e_o_description" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_s_e_o_image_id" integer;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_s_e_o_site_url" varchar;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone;
  CREATE INDEX IF NOT EXISTS "site_settings_profile_image_idx" ON "site_settings" USING btree ("profile_image_id");
  CREATE INDEX IF NOT EXISTS "site_settings_default_s_e_o_default_s_e_o_image_idx" ON "site_settings" USING btree ("default_s_e_o_image_id");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_profile_image_id_media_id_fk') THEN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_profile_image_id_media_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."site_settings"'::regclass AND conname = 'site_settings_default_s_e_o_image_id_media_id_fk') THEN
      ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_s_e_o_image_id_media_id_fk" FOREIGN KEY ("default_s_e_o_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  `)

  await assertStabilizedSchema(db)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "media_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_projects_v_version_details_approach" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_projects_v_version_details_implementation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_projects_v_version_details_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_articles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_articles_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "redirects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "redirects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "payload_folders_folder_type" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "payload_folders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "home_page_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_home_page_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "_home_page_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "site_settings_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "site_settings_socials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "site_settings_navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "media_tags" CASCADE;
  DROP TABLE IF EXISTS "_projects_v_version_details_approach" CASCADE;
  DROP TABLE IF EXISTS "_projects_v_version_details_implementation" CASCADE;
  DROP TABLE IF EXISTS "_projects_v_version_details_outcomes" CASCADE;
  DROP TABLE IF EXISTS "_projects_v" CASCADE;
  DROP TABLE IF EXISTS "_projects_v_rels" CASCADE;
  DROP TABLE IF EXISTS "_articles_v" CASCADE;
  DROP TABLE IF EXISTS "_articles_v_rels" CASCADE;
  DROP TABLE IF EXISTS "redirects" CASCADE;
  DROP TABLE IF EXISTS "redirects_rels" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs_log" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs" CASCADE;
  DROP TABLE IF EXISTS "payload_folders_folder_type" CASCADE;
  DROP TABLE IF EXISTS "payload_folders" CASCADE;
  DROP TABLE IF EXISTS "home_page" CASCADE;
  DROP TABLE IF EXISTS "home_page_rels" CASCADE;
  DROP TABLE IF EXISTS "_home_page_v" CASCADE;
  DROP TABLE IF EXISTS "_home_page_v_rels" CASCADE;
  DROP TABLE IF EXISTS "site_settings_services" CASCADE;
  DROP TABLE IF EXISTS "site_settings_socials" CASCADE;
  DROP TABLE IF EXISTS "site_settings_navigation" CASCADE;
  DROP TABLE IF EXISTS "site_settings" CASCADE;
  ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "media_payload_folder_id_payload_folders_id_fk";

  ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_meta_image_id_media_id_fk";

  ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_seo_image_id_media_id_fk";

  ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_seo_image_id_media_id_fk";

  ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_meta_image_id_media_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redirects_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_payload_folders_fk";

  DROP INDEX IF EXISTS "media_payload_folder_idx";
  DROP INDEX IF EXISTS "media_sizes_gallery_sizes_gallery_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_detail_sizes_detail_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_lightbox_sizes_lightbox_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_og_sizes_og_filename_idx";
  DROP INDEX IF EXISTS "projects_meta_meta_image_idx";
  DROP INDEX IF EXISTS "projects_seo_seo_image_idx";
  DROP INDEX IF EXISTS "projects__status_idx";
  DROP INDEX IF EXISTS "articles_seo_seo_image_idx";
  DROP INDEX IF EXISTS "articles_meta_meta_image_idx";
  DROP INDEX IF EXISTS "articles__status_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_redirects_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_payload_folders_id_idx";
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects_details_approach' AND column_name = 'text')
       AND NOT EXISTS (SELECT 1 FROM "projects_details_approach" WHERE "text" IS NULL) THEN
      ALTER TABLE "projects_details_approach" ALTER COLUMN "text" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects_details_implementation' AND column_name = 'text')
       AND NOT EXISTS (SELECT 1 FROM "projects_details_implementation" WHERE "text" IS NULL) THEN
      ALTER TABLE "projects_details_implementation" ALTER COLUMN "text" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects_details_outcomes' AND column_name = 'text')
       AND NOT EXISTS (SELECT 1 FROM "projects_details_outcomes" WHERE "text" IS NULL) THEN
      ALTER TABLE "projects_details_outcomes" ALTER COLUMN "text" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'title')
       AND NOT EXISTS (SELECT 1 FROM "projects" WHERE "title" IS NULL) THEN
      ALTER TABLE "projects" ALTER COLUMN "title" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'slug')
       AND NOT EXISTS (SELECT 1 FROM "projects" WHERE "slug" IS NULL) THEN
      ALTER TABLE "projects" ALTER COLUMN "slug" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description')
       AND NOT EXISTS (SELECT 1 FROM "projects" WHERE "description" IS NULL) THEN
      ALTER TABLE "projects" ALTER COLUMN "description" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'category')
       AND NOT EXISTS (SELECT 1 FROM "projects" WHERE "category" IS NULL) THEN
      ALTER TABLE "projects" ALTER COLUMN "category" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'year')
       AND NOT EXISTS (SELECT 1 FROM "projects" WHERE "year" IS NULL) THEN
      ALTER TABLE "projects" ALTER COLUMN "year" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'title')
       AND NOT EXISTS (SELECT 1 FROM "articles" WHERE "title" IS NULL) THEN
      ALTER TABLE "articles" ALTER COLUMN "title" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'slug')
       AND NOT EXISTS (SELECT 1 FROM "articles" WHERE "slug" IS NULL) THEN
      ALTER TABLE "articles" ALTER COLUMN "slug" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'description')
       AND NOT EXISTS (SELECT 1 FROM "articles" WHERE "description" IS NULL) THEN
      ALTER TABLE "articles" ALTER COLUMN "description" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'content')
       AND NOT EXISTS (SELECT 1 FROM "articles" WHERE "content" IS NULL) THEN
      ALTER TABLE "articles" ALTER COLUMN "content" SET NOT NULL;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'status')
       AND NOT EXISTS (SELECT 1 FROM "articles" WHERE "status" IS NULL) THEN
      ALTER TABLE "articles" ALTER COLUMN "status" SET NOT NULL;
    END IF;
  END $$;
  ALTER TABLE "media" DROP COLUMN IF EXISTS "folder";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "usage";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "credit";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "payload_folder_id";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_gallery_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_gallery_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_gallery_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_gallery_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_gallery_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_gallery_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_detail_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lightbox_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lightbox_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lightbox_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lightbox_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lightbox_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_lightbox_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filename";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "content";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "published_at";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "meta_title";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "meta_description";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "meta_no_index";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "seo_title";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "seo_description";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "seo_image_id";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "seo_canonical_url";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "seo_no_index";
  ALTER TABLE "projects" DROP COLUMN IF EXISTS "_status";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "body";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "seo_title";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "seo_description";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "seo_image_id";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "seo_canonical_url";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "seo_no_index";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "meta_title";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "meta_description";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "meta_no_index";
  ALTER TABLE "articles" DROP COLUMN IF EXISTS "_status";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "redirects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_folders_id";
  DROP TYPE IF EXISTS "public"."enum_media_folder";
  DROP TYPE IF EXISTS "public"."enum_media_usage";
  DROP TYPE IF EXISTS "public"."enum_projects_status";
  DROP TYPE IF EXISTS "public"."enum__projects_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__articles_v_version_status";
  DROP TYPE IF EXISTS "public"."enum_redirects_to_type";
  DROP TYPE IF EXISTS "public"."enum_redirects_type";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_state";
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  DROP TYPE IF EXISTS "public"."enum_payload_folders_folder_type";
  DROP TYPE IF EXISTS "public"."enum_home_page_status";
  DROP TYPE IF EXISTS "public"."enum__home_page_v_version_status";
  `)
}
