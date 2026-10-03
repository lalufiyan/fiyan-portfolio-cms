// Renders the real sidebar: a configured profile image must produce the uploaded src + CMS alt,
// and an unconfigured one must keep the gradient mark.
import "./stubs/env"

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { PortfolioSidebar } from "../../components/portfolio-sidebar"
import type { SiteSettingsView } from "../../lib/site-settings"
import { check, finish } from "./assert"

const profile: SiteSettingsView = {
  eyebrow: "Eyebrow",
  ownerName: "Owner Name",
  siteName: "Site",
  description: "Description",
  email: "owner@example.com",
  location: "Indonesia",
  services: ["Strategy"],
  socials: [{ href: "https://example.com", label: "example" }],
  navigation: [],
  defaultSEO: { title: "Title", description: "Desc", siteUrl: "https://example.com" },
}

console.log("sidebar profile image")

const withImage = renderToStaticMarkup(
  createElement(PortfolioSidebar, {
    profile: {
      ...profile,
      brandMark: { src: "https://media.example.com/portfolio/brand-mark-600x600.webp", alt: "Lalu Fityan brand mark" },
    },
  }),
)
check(
  "renders the uploaded portrait",
  withImage.includes('src="https://media.example.com/portfolio/brand-mark-600x600.webp"'),
  withImage.slice(0, 200),
)
check("renders the CMS alt text", withImage.includes('alt="Lalu Fityan brand mark"'))

const withoutImage = renderToStaticMarkup(createElement(PortfolioSidebar, { profile }))
check(
  "keeps the gradient mark when no portrait is configured",
  withoutImage.includes("from-violet-500 to-pink-500") && !withoutImage.includes("<img"),
  withoutImage.slice(0, 200),
)
check(
  "profile copy still renders",
  withoutImage.includes("Owner Name") &&
    withoutImage.includes("Description") &&
    withoutImage.includes("owner@example.com"),
)

finish()
