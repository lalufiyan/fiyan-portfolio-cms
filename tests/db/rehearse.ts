import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { migrations } from "../../migrations/index.ts"
import {
  createPool,
  inspectLegacyRecords,
  inspectSchema,
  resetDatabase,
  runMigrationUp,
  withDatabase,
  type PgPool,
} from "./fixtures.ts"

/**
 * Database-backed migration rehearsal runner.
 *
 * Rebuilds a sibling database per case, applies the checked-in migrations the
 * way a deployment does (`payload migrate` under NODE_ENV=production, so the
 * Postgres adapter never schema-pushes), then asserts the resulting schema is
 * complete and the database is still usable through the real Payload CRUD API.
 *
 * Cases:
 *   A - fresh database, all migrations run from scratch
 *   B - historical migrations already applied, only the new migrations run
 *   C - historical migrations plus a Site Settings global left behind by an
 *       earlier dev schema push, with pre-upgrade projects/articles rows
 *   D - the newest migration's up() re-run against an already-migrated database
 *
 * Any failure prints the exact check that failed and the process exits non-zero.
 *
 * Refuses to run against a remote database: production is never a valid target.
 *
 * Run with: DATABASE_URL=postgres://... pnpm run test:db
 */
const repoRoot = fileURLToPath(new URL("../../", import.meta.url))
const newestMigration = migrations[migrations.length - 1]

const assertLocalDatabase = (url: string) => {
  const { hostname } = new URL(url)
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  if (!isLocal) {
    throw new Error(`Refusing to run the destructive migration rehearsal against non-local database host "${hostname}"`)
  }
}

/** Keeps credentials out of CI logs. */
const describeUrl = (url: string) => {
  const parsed = new URL(url)
  return `${parsed.host}${parsed.pathname}`
}

/**
 * Production environment for Payload processes. Payload's Postgres adapter only
 * schema-pushes when not in production, so this is what proves the migrations
 * alone produce a working schema. R2 values are never touched by the harness.
 */
const productionEnv = (databaseUrl: string): NodeJS.ProcessEnv => ({
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: databaseUrl,
  PAYLOAD_SECRET: "rehearsal-only-secret-not-for-deployment",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
  R2_BUCKET: "unused-bucket",
  R2_ENDPOINT: "http://127.0.0.1:9000",
  R2_ACCESS_KEY_ID: "unused",
  R2_SECRET_ACCESS_KEY: "unused",
  R2_PUBLIC_URL: "http://127.0.0.1:9000",
})

type CommandResult = { ok: boolean; status: number | null; output: string; spawnError?: string }

const runCommand = (command: string, args: string[], env: NodeJS.ProcessEnv): CommandResult => {
  const result = spawnSync(command, args, { cwd: repoRoot, env, encoding: "utf8" })
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim()
  return {
    ok: result.status === 0 && !result.error,
    status: result.status,
    output,
    spawnError: result.error?.message,
  }
}

const OUTPUT_TAIL_LINES = 40

const printCommandOutput = (result: CommandResult) => {
  if (result.spawnError) {
    console.log(`    spawn error: ${result.spawnError}`)
  }
  if (!result.output) {
    return
  }

  const lines = result.output.split("\n")
  const tail = lines.slice(-OUTPUT_TAIL_LINES)
  if (tail.length < lines.length) {
    console.log(`    ... ${lines.length - tail.length} earlier output lines omitted`)
  }
  for (const line of tail) {
    console.log(`    | ${line}`)
  }
}

const errorMessage = (error: unknown) => {
  const chain: string[] = []
  let current: unknown = error
  while (current instanceof Error && chain.length < 6) {
    chain.push(current.message.split("\n")[0])
    current = current.cause
  }
  return chain.length > 0 ? chain.join(" <- ") : String(error)
}

type RehearsalCase = {
  id: string
  title: string
  database: string
  /** Fixture case passed to tests/db/prepare-fixture.ts, if any. */
  fixture?: string
  /** Assert the pre-upgrade projects/articles rows survived the migration. */
  verifyLegacyRecords?: boolean
  /** Re-run the newest migration's up() against the migrated database. */
  replayNewestMigration?: boolean
  /** Spawn the Payload CRUD harness against the migrated database. */
  runCrud: boolean
}

const cases: RehearsalCase[] = [
  {
    id: "A",
    title: "fresh database",
    database: "portfolio_rehearse_a",
    runCrud: true,
  },
  {
    id: "B",
    title: "historical migrations only",
    database: "portfolio_rehearse_b",
    fixture: "old",
    runCrud: true,
  },
  {
    id: "C",
    title: "historical migrations + pre-existing site_settings + legacy data",
    database: "portfolio_rehearse_c",
    fixture: "old-settings-data",
    verifyLegacyRecords: true,
    runCrud: true,
  },
  {
    id: "D",
    title: `newest migration re-applied (${newestMigration.name})`,
    database: "portfolio_rehearse_d",
    replayNewestMigration: true,
    runCrud: false,
  },
]

type CaseResult = { id: string; title: string; failures: string[] }

const runCase = async (spec: RehearsalCase, maintenancePool: PgPool, baseUrl: string): Promise<CaseResult> => {
  const failures: string[] = []
  const caseUrl = withDatabase(baseUrl, spec.database)
  const log = (message: string) => console.log(`  ${message}`)

  log(`recreating database ${spec.database}`)
  await resetDatabase(maintenancePool, spec.database)

  if (spec.fixture) {
    log(`building fixture "${spec.fixture}" (historical migrations)`)
    const fixture = runCommand("pnpm", ["exec", "tsx", "tests/db/prepare-fixture.ts", spec.fixture], {
      ...process.env,
      DATABASE_URL: caseUrl,
    })
    if (!fixture.ok) {
      failures.push(`fixture "${spec.fixture}" failed (exit ${fixture.status ?? "null"})`)
      printCommandOutput(fixture)
      return { id: spec.id, title: spec.title, failures }
    }
  }

  log("applying migrations (NODE_ENV=production)")
  const migrate = runCommand("pnpm", ["payload:migrate"], productionEnv(caseUrl))
  if (!migrate.ok) {
    failures.push(`payload migrate failed (exit ${migrate.status ?? "null"})`)
    printCommandOutput(migrate)
  }

  const pool = createPool(caseUrl)
  try {
    if (spec.replayNewestMigration) {
      if (migrate.ok) {
        log(`re-running newest migration "${newestMigration.name}"`)
        try {
          await runMigrationUp(pool, newestMigration)
        } catch (error) {
          failures.push(`re-running newest migration threw: ${errorMessage(error)}`)
        }
      } else {
        failures.push("skipped re-running newest migration because payload migrate failed")
      }
    }

    log("inspecting migrated schema")
    const checks = await inspectSchema(pool)
    const missing = checks.filter((check) => !check.ok)
    log(`schema checks: ${checks.length - missing.length}/${checks.length} ok`)
    for (const check of missing) {
      failures.push(`missing ${check.detail}`)
    }

    if (spec.verifyLegacyRecords) {
      log("checking pre-upgrade records survived")
      const legacy = await inspectLegacyRecords(pool)
      if (!legacy.project) {
        failures.push("missing legacy project record (projects.slug = 'legacy-project')")
      }
      if (!legacy.article) {
        failures.push("missing legacy article record (articles.slug = 'legacy-article')")
      }
    }
  } finally {
    await pool.end()
  }

  if (spec.runCrud) {
    log("running Payload CRUD harness")
    const crud = runCommand("pnpm", ["exec", "tsx", "tests/db/crud.ts"], productionEnv(caseUrl))
    if (!crud.ok) {
      failures.push(`CRUD harness failed (exit ${crud.status ?? "null"})`)
      printCommandOutput(crud)
    }
  }

  return { id: spec.id, title: spec.title, failures }
}

const main = async () => {
  const baseUrl = process.env.DATABASE_URL?.trim()
  if (!baseUrl) {
    console.error("DATABASE_URL is required for the database migration rehearsal")
    process.exit(1)
  }
  assertLocalDatabase(baseUrl)

  console.log("Database migration rehearsal")
  console.log(`  maintenance database: ${describeUrl(baseUrl)}`)
  console.log(`  newest migration: ${newestMigration.name}`)

  const maintenancePool = createPool(baseUrl)
  const results: CaseResult[] = []

  try {
    for (const spec of cases) {
      console.log(`\nCase ${spec.id}: ${spec.title}`)
      try {
        results.push(await runCase(spec, maintenancePool, baseUrl))
      } catch (error) {
        results.push({ id: spec.id, title: spec.title, failures: [`unexpected error: ${errorMessage(error)}`] })
      }
    }
  } finally {
    await maintenancePool.end()
  }

  console.log("\n" + "=".repeat(64))
  console.log("Database migration rehearsal summary")
  for (const result of results) {
    console.log(`  ${result.failures.length === 0 ? "PASS" : "FAIL"} Case ${result.id}: ${result.title}`)
    for (const failure of result.failures) {
      console.log(`    - ${failure}`)
    }
  }

  const passed = results.filter((result) => result.failures.length === 0).length
  console.log(`\n${passed}/${results.length} rehearsal cases passed`)

  process.exit(passed === results.length ? 0 : 1)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
