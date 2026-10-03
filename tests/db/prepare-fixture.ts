import {
  createPool,
  historicalMigrations,
  insertLegacyRecords,
  insertPushedSiteSettings,
  recordAppliedMigrations,
  runMigrationUp,
  type PgPool,
} from "./fixtures.ts"

/**
 * Builds a historical database state for the migration rehearsal.
 *
 * Cases:
 *   old           - schema created only by the checked-in historical migrations
 *   old-settings  - historical schema plus a Site Settings global left behind by
 *                   an earlier Payload dev schema push (the regression case)
 *
 * Run with: tsx tests/db/prepare-fixture.ts <case>
 */
const caseName = process.argv[2]

const applyHistoricalSchema = async (pool: PgPool) => {
  for (const migration of historicalMigrations) {
    await runMigrationUp(pool, migration)
  }
  await recordAppliedMigrations(
    pool,
    historicalMigrations.map((migration) => migration.name),
  )
}

const cases: Record<string, (pool: PgPool) => Promise<void>> = {
  "old": async (pool) => {
    await applyHistoricalSchema(pool)
  },
  "old-settings": async (pool) => {
    await applyHistoricalSchema(pool)
    await insertPushedSiteSettings(pool)
  },
  "old-data": async (pool) => {
    await applyHistoricalSchema(pool)
    await insertLegacyRecords(pool)
  },
  "old-settings-data": async (pool) => {
    await applyHistoricalSchema(pool)
    await insertPushedSiteSettings(pool)
    await insertLegacyRecords(pool)
  },
}

const main = async () => {
  const prepare = cases[caseName]

  if (!prepare) {
    throw new Error(`Unknown fixture case "${caseName ?? ""}". Expected one of: ${Object.keys(cases).join(", ")}`)
  }

  const connectionString = process.env.DATABASE_URL?.trim()

  if (!connectionString) {
    throw new Error("DATABASE_URL is required")
  }

  const pool = createPool(connectionString)

  try {
    await prepare(pool)
    console.log(`prepared fixture "${caseName}"`)
  } finally {
    await pool.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
