import configPromise from "@payload-config"
import { getPayload } from "payload"
import { cache } from "react"

export interface ProjectsPageSettings {
  description: string
  eyebrow: string
  heading: string
}

// Fallback copy mirrors the Projects Page global defaults so the archive renders
// identically when the CMS is unavailable.
const fallbackProjectsPageSettings: ProjectsPageSettings = {
  eyebrow: "Project Archive",
  heading: "Projects",
  description:
    "A focused archive of strategy, communications, campaign, and event work. Each entry opens into a text-led project view with the same media and captions used throughout the portfolio.",
}

const cmsEnabled = Boolean(process.env.DATABASE_URL?.trim())

const toText = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value : fallback)

const toProjectsPageSettings = (settings: Record<string, unknown> | undefined): ProjectsPageSettings => ({
  eyebrow: toText(settings?.eyebrow, fallbackProjectsPageSettings.eyebrow),
  heading: toText(settings?.heading, fallbackProjectsPageSettings.heading),
  description: toText(settings?.description, fallbackProjectsPageSettings.description),
})

const readProjectsPageSettings = async (): Promise<ProjectsPageSettings> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = (await payload.findGlobal({
      slug: "projects-page",
      depth: 0,
    })) as unknown as Record<string, unknown>

    return toProjectsPageSettings(settings)
  } catch (error) {
    console.error("[projects-page] Failed to load the Projects Page settings; using fallback copy.", error)
    return fallbackProjectsPageSettings
  }
}

// The archive shell renders on demand; only its project list uses the
// persistent tag cache. Keep editorial copy request-local after saves.
export const getProjectsPageSettings = cache(async (): Promise<ProjectsPageSettings> => {
  if (!cmsEnabled) {
    return fallbackProjectsPageSettings
  }

  return readProjectsPageSettings()
})
