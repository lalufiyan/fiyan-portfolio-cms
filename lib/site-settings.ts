import configPromise from "@payload-config"
import { getPayload } from "payload"
import { cache } from "react"

import { getSiteURL } from "@/lib/site-url"
import { mediaSrc } from "@/lib/media-url"

interface SiteLink {
  href: string
  label: string
  openInNewTab?: boolean
}

interface SiteImage {
  alt: string
  src: string
}

export interface SiteSettingsView {
  defaultSEO: {
    description: string
    image?: string
    siteUrl: string
    title: string
  }
  description: string
  email: string
  eyebrow: string
  location: string
  brandMark?: SiteImage
  ownerName: string
  services: string[]
  siteName: string
  socials: SiteLink[]
  navigation: SiteLink[]
}

// Canonical profile fallback: the single source of truth for sidebar/profile content when the CMS
// is unavailable. `brandMark` is intentionally omitted so the sidebar keeps its gradient mark
// until an editor uploads a brand image.
export const fallbackSiteSettings: SiteSettingsView = {
  eyebrow: "Strategic Communications & Project Management",
  ownerName: "Lalu Fityan Dawam Syarief",
  siteName: "Lalu Fityan Portfolio",
  description:
    "A results-driven Strategic Communications and Project Manager with a Master's in Communication Science. I transform complex challenges into successful campaigns, from high-stakes political branding to international event management, always delivering measurable, data-backed outcomes.",
  email: "lalufityandawamsyarief@gmail.com",
  location: "Indonesia - UTC+7",
  services: [
    "Political Branding",
    "Digital Strategy",
    "Event Management",
    "Project Management",
    "Content Strategy",
    "Creative Direction",
  ],
  socials: [
    {
      href: "https://linkedin.com/in/lalufityan/",
      label: "linkedin",
    },
    {
      href: "https://instagram.com/fiyanzaki",
      label: "instagram @fiyanzaki",
    },
  ],
  navigation: [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/#connect", label: "Contact" },
    {
      href: "https://docs.google.com/document/d/13IG0d7LuFpOaRBssLf7zdI6xS9csAIey80tGFTtKhb4/edit?usp=sharing",
      label: "Resume",
      openInNewTab: true,
    },
  ],
  defaultSEO: {
    title: "Lalu Fityan | Strategic Communications & Project Management Expert",
    description:
      "Proven Strategic Communications and Project Management professional with Master's in Communication Science. Delivered 80%+ campaign growth, managed 25,000+ event participants, and secured electoral victories through data-driven strategies.",
    image: "/images/lalu-fityan-new-profile.webp",
    siteUrl: getSiteURL(),
  },
}

const cmsEnabled = Boolean(process.env.DATABASE_URL?.trim())

const toLabelArray = (items: unknown, fallback: string[]) => {
  if (!Array.isArray(items)) {
    return fallback
  }

  const labels = items
    .map((item) => (item && typeof item === "object" && "label" in item ? String(item.label) : ""))
    .filter(Boolean)

  return labels.length > 0 ? labels : fallback
}

const toLinks = (items: unknown, fallback: SiteLink[]) => {
  if (!Array.isArray(items)) {
    return fallback
  }

  const links: SiteLink[] = []

  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue
    }

    const record = item as { href?: unknown; label?: unknown; openInNewTab?: unknown }
    if (typeof record.href !== "string" || typeof record.label !== "string") {
      continue
    }

    links.push({
      href: record.href,
      label: record.label,
      openInNewTab: Boolean(record.openInNewTab),
    })
  }

  return links.length > 0 ? links : fallback
}

const toText = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value : fallback)

/**
 * Normalize a Payload upload relation (populated doc, bare id, or null) into the typed
 * `{ src, alt }` the sidebar renders. Returns undefined when no renderable source exists so
 * callers keep their non-image treatment (the sidebar's gradient mark).
 */
const toSiteImage = (media: unknown, preferredSizes: string[], fallbackAlt: string): SiteImage | undefined => {
  const src = mediaSrc(media, preferredSizes)

  if (!src) {
    return undefined
  }

  const alt = media && typeof media === "object" && "alt" in media ? media.alt : undefined

  return { alt: typeof alt === "string" && alt.trim() ? alt : fallbackAlt, src }
}

const readSiteSettings = async (): Promise<SiteSettingsView> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = (await payload.findGlobal({
      slug: "site-settings",
      depth: 2,
    })) as unknown as Record<string, unknown>
    const defaultSEO = (settings.defaultSEO || {}) as Record<string, unknown>
    const ownerName = toText(settings.ownerName, fallbackSiteSettings.ownerName)

    return {
      eyebrow: toText(settings.eyebrow, fallbackSiteSettings.eyebrow),
      ownerName,
      siteName: toText(settings.siteName, fallbackSiteSettings.siteName),
      description: toText(settings.description, fallbackSiteSettings.description),
      email: toText(settings.email, fallbackSiteSettings.email),
      location: toText(settings.location, fallbackSiteSettings.location),
      brandMark: toSiteImage(settings.brandMark, ["gallery", "thumbnail", "detail"], ownerName),
      services: toLabelArray(settings.services, fallbackSiteSettings.services),
      socials: toLinks(settings.socials, fallbackSiteSettings.socials),
      navigation: toLinks(settings.navigation, fallbackSiteSettings.navigation),
      defaultSEO: {
        title: toText(defaultSEO.title, fallbackSiteSettings.defaultSEO.title),
        description: toText(defaultSEO.description, fallbackSiteSettings.defaultSEO.description),
        image: mediaSrc(defaultSEO.image, ["detail", "thumbnail"]) || fallbackSiteSettings.defaultSEO.image,
        siteUrl: toText(defaultSEO.siteUrl, fallbackSiteSettings.defaultSEO.siteUrl),
      },
    }
  } catch (error) {
    // Fallbacks keep the site usable, but a silent catch hides real misconfiguration
    // (missing table, credentials, or schema drift) from operators.
    console.error("[site-settings] Failed to load Payload Site Settings; using fallback content.", error)
    return fallbackSiteSettings
  }
}

// Request-local deduplication keeps editor saves visible on the next render.
// A persistent tag cache served one stale sidebar after a Payload route save.
export const getSiteSettings = cache(async (): Promise<SiteSettingsView> => {
  if (!cmsEnabled) {
    return fallbackSiteSettings
  }

  return readSiteSettings()
})
