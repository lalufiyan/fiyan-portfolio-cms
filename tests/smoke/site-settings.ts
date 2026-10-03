// Exercises the real brandMark normalization in lib/site-settings with a fake Payload client, so
// the src/alt the sidebar receives is checked without a database.
import "./stubs/env"

import { getSiteSettings, type SiteSettingsView } from "../../lib/site-settings"
import { check, finish } from "./assert"

const media = (overrides: Record<string, unknown>) => ({
  id: 1,
  alt: "Lalu Fityan brand mark",
  filename: "brand-mark.webp",
  url: "https://media.example.com/portfolio/brand-mark.webp",
  sizes: { gallery: { url: "https://media.example.com/portfolio/brand-mark-600x600.webp" } },
  ...overrides,
})

const settingsFor = (brandMark: unknown): Promise<SiteSettingsView> => {
  ;(globalThis as Record<string, unknown>).__fakePayload = {
    findGlobal: async () => ({ ownerName: "Owner Name", brandMark }),
  }

  return getSiteSettings()
}

const main = async () => {
  console.log("site-settings brandMark normalization")

  const configured = await settingsFor(media({}))
  check(
    "configured upload yields the square gallery derivative src + CMS alt",
    configured.brandMark?.src === "https://media.example.com/portfolio/brand-mark-600x600.webp" &&
      configured.brandMark?.alt === "Lalu Fityan brand mark",
    JSON.stringify(configured.brandMark),
  )

  const blankAlt = await settingsFor(media({ alt: "   " }))
  check(
    "blank alt falls back to the owner name",
    blankAlt.brandMark?.alt === "Owner Name",
    JSON.stringify(blankAlt.brandMark),
  )

  const idOnly = await settingsFor(7)
  check(
    "an unpopulated relation keeps the gradient fallback",
    idOnly.brandMark === undefined,
    JSON.stringify(idOnly.brandMark),
  )

  const empty = await settingsFor(null)
  check("a null relation keeps the gradient fallback", empty.brandMark === undefined, JSON.stringify(empty.brandMark))

  const filenameOnly = await settingsFor(media({ url: undefined, sizes: undefined, prefix: undefined }))
  check(
    "a filename-only upload resolves under the R2 public base",
    filenameOnly.brandMark?.src === "https://media.example.com/brand-mark.webp",
    JSON.stringify(filenameOnly.brandMark),
  )

  const prefixed = await settingsFor(media({ url: undefined, sizes: undefined, prefix: "portfolio" }))
  check(
    "a filename + prefix upload resolves under the R2 public base",
    prefixed.brandMark?.src === "https://media.example.com/portfolio/brand-mark.webp",
    JSON.stringify(prefixed.brandMark),
  )

  finish()
}

void main()
