import "../globals.css"
import { geistMonoFont, plusJakartaSans } from "../fonts"
import type React from "react"
import { PreviewLiveMode } from "@/components/preview-live-mode"
import { SiteShell } from "@/components/site-shell"
import { getSiteSettings } from "@/lib/site-settings"
import type { Metadata } from "next"

const safeUrl = (value: string) => {
  try {
    return new URL(value)
  } catch {
    return new URL("http://localhost:3000")
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings.defaultSEO.title
  const description = settings.defaultSEO.description
  const siteUrl = safeUrl(settings.defaultSEO.siteUrl)
  const image = settings.defaultSEO.image

  return {
    title,
    description,
    metadataBase: siteUrl,
    keywords: [
      "Strategic Communications",
      "Project Management",
      "Campaign Management",
      "Digital Strategy",
      "Event Management",
      "Political Branding",
      "Team Leadership",
      "Data-Driven Results",
      "Master's Communication Science",
      "Indonesia",
    ],
    authors: [{ name: settings.ownerName }],
    creator: settings.ownerName,
    publisher: settings.ownerName,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: settings.siteName,
      title,
      description,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: settings.ownerName,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
      creator: "@fiyanzaki",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    generator: "Payload CMS",
  }
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()

  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${geistMonoFont.variable}`} suppressHydrationWarning>
      <body className={`${plusJakartaSans.className} flex flex-col min-h-screen`}>
        <PreviewLiveMode />
        <SiteShell settings={settings}>
          {children}
        </SiteShell>
      </body>
    </html>
  )
}
