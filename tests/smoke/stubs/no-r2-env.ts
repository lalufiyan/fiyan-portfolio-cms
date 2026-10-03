// Imported first by tests/smoke/site-settings-no-r2.ts so lib/media-url evaluates without an R2
// public base. Bun auto-loads .env.local, so clear the value the other cases pin.
process.env.DATABASE_URL = "postgres://smoke:smoke@127.0.0.1:5432/smoke"
process.env.R2_PUBLIC_URL = ""

export {}
