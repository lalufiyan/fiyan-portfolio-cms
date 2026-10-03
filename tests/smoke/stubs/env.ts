// Imported first by the smoke cases so lib/site-settings reads these values when it is evaluated.
// Bun auto-loads .env.local, so pin the values the assertions depend on.
process.env.DATABASE_URL = "postgres://smoke:smoke@127.0.0.1:5432/smoke"
process.env.R2_PUBLIC_URL = "https://media.example.com"

export {}
