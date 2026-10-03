import type { MetadataRoute } from "next"

import { getSiteSettings } from "@/lib/site-settings"
import { absoluteURL } from "@/lib/site-url"

export const revalidate = 300

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings()

  return {
    host: settings.defaultSEO.siteUrl,
    rules: {
      allow: "/",
      disallow: ["/admin/", "/api/"],
      userAgent: "*",
    },
    sitemap: absoluteURL("/sitemap.xml", settings.defaultSEO.siteUrl),
  }
}
