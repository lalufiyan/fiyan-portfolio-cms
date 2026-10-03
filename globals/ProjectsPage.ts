import type { GlobalConfig } from "payload"

import { authenticated, publicRead } from "../collections/access"

/**
 * Copy for the public project archive at `/projects`. Only the fields the page
 * actually renders are exposed here; the archive listing itself comes from the
 * Projects collection.
 */
export const ProjectsPage: GlobalConfig = {
  slug: "projects-page",
  label: "Projects Page",
  access: {
    read: publicRead,
    update: authenticated,
  },
  admin: {
    description: "Eyebrow, heading, and description shown at the top of the project archive.",
  },
  fields: [
    {
      name: "eyebrow",
      label: "Eyebrow",
      type: "text",
      defaultValue: "Project Archive",
      admin: {
        description: "Small label above the heading.",
      },
    },
    {
      name: "heading",
      label: "Heading",
      type: "text",
      defaultValue: "Projects",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      defaultValue:
        "A focused archive of strategy, communications, campaign, and event work. Each entry opens into a text-led project view with the same media and captions used throughout the portfolio.",
      admin: {
        description: "Opening paragraph under the heading.",
      },
    },
  ],
}
