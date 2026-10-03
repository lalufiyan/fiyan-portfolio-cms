import type { CheckboxFieldValidation, GlobalConfig } from "payload"

import { authenticated, publishedOrAuthenticated } from "../collections/access"
import { revalidateHomePage } from "../hooks/revalidate"
import { generatePreviewPath } from "../lib/preview"

const emptySelectionMessage =
  "Select at least one landing page project, or turn \"Use featured projects when empty\" back on. An empty selection with the fallback off leaves no curated slides to publish."

// Publish-time guard for the one configuration that has no curated homepage to render. Drafts and
// autosave skip validation, so editors can keep working; only publishing the contradictory state is
// blocked. The frontend additionally falls back to featured projects, so production never goes blank.
const validateFallbackToFeatured: CheckboxFieldValidation = (value, { siblingData }) => {
  if (value !== false) {
    return true
  }

  const selection =
    siblingData && typeof siblingData === "object" && "landingProjects" in siblingData
      ? siblingData.landingProjects
      : undefined

  return Array.isArray(selection) && selection.length > 0 ? true : emptySelectionMessage
}

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  access: {
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  admin: {
    description: "Landing page controls for project slide order and homepage publishing copy.",
    preview: () => generatePreviewPath("/"),
    livePreview: {
      url: () => generatePreviewPath("/"),
      breakpoints: [
        {
          label: "Mobile",
          name: "mobile",
          width: 390,
          height: 844,
        },
        {
          label: "Desktop",
          name: "desktop",
          width: 1440,
          height: 1100,
        },
      ],
    },
  },
  hooks: {
    afterChange: [revalidateHomePage],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 500,
      },
      schedulePublish: true,
    },
    max: 50,
  },
  fields: [
    {
      name: "landingProjects",
      label: "Landing page projects",
      type: "relationship",
      relationTo: "projects",
      hasMany: true,
      admin: {
        components: {
          Field: "@/components/payload/landing-projects-field#LandingProjectsField",
        },
        description:
          "Choose and order the projects shown as homepage slides. Leave empty to fall back to featured projects unless the fallback below is turned off. Draft projects can be selected, but they only render in preview until they are published.",
      },
    },
    {
      name: "fallbackToFeatured",
      label: "Use featured projects when empty",
      type: "checkbox",
      defaultValue: true,
      validate: validateFallbackToFeatured,
      admin: {
        description:
          "When no landing page projects are selected, fill the homepage with featured projects. Turning this off with an empty selection blocks publishing.",
      },
    },
  ],
}
