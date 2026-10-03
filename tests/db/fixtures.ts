import { createRequire } from "node:module"

import type { MigrateUpArgs } from "@payloadcms/db-postgres"

import * as historicalArticles from "../../migrations/20260527_153859_add_articles_and_image_admin_labels"
import * as historicalBaseline from "../../migrations/20260502_154117___name"

/**
 * Shared fixtures for the database migration rehearsal.
 *
 * `pg` and `drizzle-orm` are transitive dependencies of the Payload Postgres
 * adapter, so they are resolved through it instead of being added as direct
 * dependencies of the app.
 */
const requireFromAdapter = createRequire(import.meta.resolve("@payloadcms/db-postgres"))
const { Pool } = requireFromAdapter("pg") as {
  Pool: new (config: { connectionString: string }) => PgPool
}
const { drizzle } = requireFromAdapter("drizzle-orm/node-postgres") as {
  drizzle: (pool: PgPool) => unknown
}

export type QueryResult<Row = Record<string, unknown>> = {
  rowCount: number | null
  rows: Row[]
}

export type PgPool = {
  end: () => Promise<void>
  query: <Row = Record<string, unknown>>(text: string, values?: unknown[]) => Promise<QueryResult<Row>>
}

export const createPool = (connectionString: string): PgPool => new Pool({ connectionString })

export const openDrizzle = (pool: PgPool): MigrateUpArgs["db"] => drizzle(pool) as MigrateUpArgs["db"]

/** The migrations that exist in git history before this pass; fixtures start from these. */
export const historicalMigrations = [
  { name: "20260502_154117___name", up: historicalBaseline.up },
  { name: "20260527_153859_add_articles_and_image_admin_labels", up: historicalArticles.up },
]

export const runMigrationUp = async (pool: PgPool, migration: { up: (args: MigrateUpArgs) => Promise<void> }) => {
  await migration.up({ db: openDrizzle(pool) } as MigrateUpArgs)
}

/**
 * Records historical migrations the way the Payload CLI does, so the later
 * `payload migrate` run applies only the migrations under test instead of
 * replaying the whole history against existing tables.
 */
export const recordAppliedMigrations = async (pool: PgPool, names: string[]) => {
  for (const name of names) {
    await pool.query("INSERT INTO payload_migrations (name, batch, created_at, updated_at) VALUES ($1, 1, now(), now())", [
      name,
    ])
  }
}

export const withDatabase = (baseUrl: string, database: string) => {
  const url = new URL(baseUrl)
  url.pathname = `/${database}`
  return url.toString()
}

export const resetDatabase = async (pool: PgPool, database: string) => {
  await pool.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`)
  await pool.query(`CREATE DATABASE "${database}"`)
}

export const insertLegacyRecords = async (pool: PgPool) => {
  await pool.query(
    `INSERT INTO projects (title, slug, description, category, year, featured)
     VALUES ('Legacy Project', 'legacy-project', 'Pre-upgrade record', 'Strategy', '2024', true)`,
  )
  await pool.query(
    `INSERT INTO articles (title, slug, description, content, status, published_at)
     VALUES ('Legacy Article', 'legacy-article', 'Pre-upgrade article', 'Legacy body text', 'published', now())`,
  )
}

/**
 * Simulates the real upgrade shape: Payload's dev-time schema push already
 * created the Site Settings global, while Projects/Articles are still on the
 * historical schema.
 */
export const insertPushedSiteSettings = async (pool: PgPool) => {
  await pool.query(`
    CREATE TABLE site_settings (
      id serial PRIMARY KEY,
      eyebrow varchar,
      owner_name varchar NOT NULL,
      site_name varchar NOT NULL,
      description varchar,
      email varchar,
      location varchar,
      updated_at timestamp(3) with time zone,
      created_at timestamp(3) with time zone
    );
    CREATE TABLE site_settings_services (_order integer NOT NULL, _parent_id integer NOT NULL, id varchar PRIMARY KEY NOT NULL, label varchar NOT NULL);
    CREATE TABLE site_settings_socials (_order integer NOT NULL, _parent_id integer NOT NULL, id varchar PRIMARY KEY NOT NULL, label varchar, href varchar NOT NULL);
    CREATE TABLE site_settings_navigation (_order integer NOT NULL, _parent_id integer NOT NULL, id varchar PRIMARY KEY NOT NULL, label varchar NOT NULL, href varchar NOT NULL, open_in_new_tab boolean DEFAULT false);
    ALTER TABLE site_settings_services ADD CONSTRAINT site_settings_services_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES site_settings(id) ON DELETE cascade;
    ALTER TABLE site_settings_socials ADD CONSTRAINT site_settings_socials_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES site_settings(id) ON DELETE cascade;
    ALTER TABLE site_settings_navigation ADD CONSTRAINT site_settings_navigation_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES site_settings(id) ON DELETE cascade;
    INSERT INTO site_settings (owner_name, site_name, description) VALUES ('Legacy Owner', 'Legacy Site', 'Pushed before the stabilization migration');
  `)
}

const requiredTables = [
  "_articles_v",
  "_articles_v_rels",
  "_home_page_v",
  "_projects_v",
  "_projects_v_rels",
  "home_page",
  "media_tags",
  "payload_folders",
  "projects_page",
  "redirects",
  "site_settings",
  "site_settings_navigation",
  "site_settings_services",
  "site_settings_socials",
]

const requiredColumns: [string, string][] = [
  ["articles", "_status"],
  ["articles", "body"],
  ["articles", "content"],
  ["articles", "seo_title"],
  ["media", "folder"],
  ["media", "prefix"],
  ["media", "sizes_gallery_filename"],
  ["media", "sizes_og_filename"],
  ["media", "usage"],
  ["projects", "_status"],
  ["projects", "content"],
  ["projects", "meta_title"],
  ["projects", "published_at"],
  ["projects", "seo_title"],
  ["site_settings", "brand_mark_id"],
]

export type SchemaCheck = { detail: string; ok: boolean }

export const inspectSchema = async (pool: PgPool): Promise<SchemaCheck[]> => {
  const checks: SchemaCheck[] = []

  for (const table of requiredTables) {
    const result = await pool.query<{ present: boolean }>("SELECT to_regclass($1) IS NOT NULL AS present", [`public.${table}`])
    checks.push({ detail: `table ${table}`, ok: Boolean(result.rows[0]?.present) })
  }

  for (const [table, column] of requiredColumns) {
    const result = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
      [table, column],
    )
    checks.push({ detail: `column ${table}.${column}`, ok: result.rows.length > 0 })
  }

  const contentNullable = await pool.query<{ is_nullable: string }>(
    "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'content'",
  )
  checks.push({ detail: "articles.content nullable", ok: contentNullable.rows[0]?.is_nullable === "YES" })

  return checks
}

export const inspectLegacyRecords = async (pool: PgPool) => {
  const projects = await pool.query<{ description: string; slug: string }>(
    "SELECT slug, description FROM projects WHERE slug = 'legacy-project'",
  )
  const articles = await pool.query<{ description: string; slug: string }>(
    "SELECT slug, description FROM articles WHERE slug = 'legacy-article'",
  )

  return {
    article: articles.rows[0],
    project: projects.rows[0],
  }
}
