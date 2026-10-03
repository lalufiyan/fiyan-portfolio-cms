import type { MetadataRoute } from "next"

import { getAllProjects } from "@/lib/projects-cms"
import { getSiteSettings } from "@/lib/site-settings"
import { absoluteURL } from "@/lib/site-url"

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, projects] = await Promise.all([getSiteSettings(), getAllProjects()])
  const siteUrl = settings.defaultSEO.siteUrl
  const now = new Date()

  return [
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 1,
      url: siteUrl,
    },
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 0.8,
      url: absoluteURL("/projects", siteUrl),
    },
    ...projects.map((project) => ({
      changeFrequency: "monthly" as const,
      lastModified: now,
      priority: 0.7,
      url: absoluteURL(`/projects/${project.slug}`, siteUrl),
    })),
  ]
}
