import type { GlobalConfig } from "payload"

import { authenticated, publicRead } from "../collections/access"
import { revalidateSiteSettings } from "../hooks/revalidate"

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: publicRead,
    update: authenticated,
  },
  admin: {
    description: "Portfolio-wide profile, navigation, contact, and default SEO settings.",
  },
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Profile",
          fields: [
            {
              name: "eyebrow",
              type: "text",
            },
            {
              name: "ownerName",
              label: "Owner name",
              type: "text",
              required: true,
            },
            {
              name: "siteName",
              label: "Site name",
              type: "text",
              required: true,
            },
            {
              name: "brandMark",
              label: "Brand mark",
              type: "upload",
              relationTo: "media",
              displayPreview: true,
              admin: {
                description:
                  "Small image or logo shown at the top of the portfolio sidebar. Leave empty to use the gradient mark.",
                sortOptions: "-updatedAt",
              },
            },
            {
              name: "description",
              type: "textarea",
            },
            {
              name: "email",
              type: "email",
            },
            {
              name: "location",
              type: "text",
            },
            {
              name: "services",
              type: "array",
              fields: [
                {
                  name: "label",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: "Links",
          fields: [
            {
              name: "socials",
              type: "array",
              labels: {
                singular: "Social link",
                plural: "Social links",
              },
              fields: [
                {
                  name: "label",
                  type: "text",
                  required: true,
                },
                {
                  name: "href",
                  label: "URL",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "navigation",
              type: "array",
              labels: {
                singular: "Navigation link",
                plural: "Navigation links",
              },
              fields: [
                {
                  name: "label",
                  type: "text",
                  required: true,
                },
                {
                  name: "href",
                  label: "URL",
                  type: "text",
                  required: true,
                },
                {
                  name: "openInNewTab",
                  label: "Open in new tab",
                  type: "checkbox",
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            {
              name: "defaultSEO",
              label: "Default SEO",
              type: "group",
              fields: [
                {
                  name: "title",
                  label: "Default title",
                  type: "text",
                },
                {
                  name: "description",
                  label: "Default description",
                  type: "textarea",
                },
                {
                  name: "image",
                  label: "Default share image",
                  type: "upload",
                  relationTo: "media",
                  displayPreview: true,
                  admin: {
                    sortOptions: "-updatedAt",
                  },
                },
                {
                  name: "siteUrl",
                  label: "Site URL",
                  type: "text",
                  admin: {
                    description: "Production URL used for canonical and Open Graph metadata.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
