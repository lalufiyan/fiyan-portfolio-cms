// Scoped smoke runner for the CMS profile-image + homepage-slide-guard changes.
//
// Every case under tests/smoke/*.ts(x) is executed in its own process. Payload/Next server-only
// modules (payload, @payload-config, next/cache) cannot run in a bare script, so tests/smoke/tsconfig.json
// maps those specifiers to tests/smoke/stubs/* via `paths`, which tsx honours.
// Run with: pnpm run test:smoke
import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const smokeDir = fileURLToPath(new URL("./", import.meta.url))
const repoRoot = fileURLToPath(new URL("../../", import.meta.url))
const tsconfigPath = join(smokeDir, "tsconfig.json")

const runnerFiles = new Set(["assert.ts", "run.ts"])
const cases = readdirSync(smokeDir)
  .filter((file) => /\.tsx?$/.test(file) && !runnerFiles.has(file))
  .sort()

let failed = false

for (const file of cases) {
  const result = spawnSync(process.execPath, ["--import", "tsx", join(smokeDir, file)], {
    cwd: repoRoot,
    env: { ...process.env, TSX_TSCONFIG_PATH: tsconfigPath },
    stdio: "inherit",
  })

  if (result.status !== 0) {
    console.error(`\n${file} failed`)
    failed = true
  }
}

process.exit(failed ? 1 : 0)
