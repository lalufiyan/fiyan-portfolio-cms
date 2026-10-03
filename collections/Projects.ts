import type { CollectionConfig } from "payload"
import { legacySeoField } from "../fields/legacy-seo"
import { richTextEditor } from "../lib/payload-rich-text-editor"
import { authenticated, publishedOrAuthenticated } from "./access"
import { populatePublishedAt } from "../hooks/populate-published-at"
import { revalidateProject, revalidateProjectDelete } from "../hooks/revalidate"
import { generatePreviewPath } from "../lib/preview"

const listField = (name: string, label: string) => ({
  name,
  label,
  type: "array" as const,
  fields: [
    {
      name: "text",
      type: "textarea" as const,
      required: true,
    },
  ],
})

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: {
    singular: "Portfolio Project",
    plural: "Portfolio Projects",
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: publishedOrAuthenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["thumbnail", "title", "category", "year", "featured", "updatedAt"],
    listSearchableFields: ["title", "slug", "category", "client"],
    pagination: {
      defaultLimit: 10,
      limits: [10, 25, 50],
    },
    components: {
      views: {
        list: {
          Component: "@/components/payload/projects-grid-list-view#ProjectsGridListView",
        },
      },
    },
    preview: (doc) => (typeof doc.slug === "string" ? generatePreviewPath(`/projects/${doc.slug}`) : null),
    livePreview: {
      url: ({ data }) =>
        typeof data.slug === "string" ? generatePreviewPath(`/projects/${data.slug}`, { previewMode: "live" }) : null,
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
    description:
      "Manage portfolio case studies. Write the body like an article, then choose featured and gallery images from the Media Library.",
  },
  versions: {
    drafts: {
      autosave: {
        interval: 500,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          description: "Write this project like a case-study article. Use headings, lists, links, and embedded media.",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
            },
            {
              name: "slug",
              type: "text",
              required: true,
              unique: true,
              index: true,
            },
            {
              name: "description",
              type: "textarea",
              required: true,
              admin: {
                description: "Short summary used in cards and project headers.",
              },
            },
            {
              name: "content",
              label: "Project body",
              type: "richText",
              editor: richTextEditor,
              admin: {
                description:
                  "Main case-study content. Existing seeded details have been converted here so editors can write normally.",
              },
            },
          ],
        },
        {
          label: "Project info",
          fields: [
            {
              name: "category",
              type: "text",
              required: true,
              index: true,
            },
            {
              name: "year",
              type: "text",
              required: true,
            },
            {
              name: "role",
              type: "text",
            },
            {
              name: "client",
              type: "text",
            },
            {
              name: "featured",
              label: "Featured (homepage fallback)",
              type: "checkbox",
              defaultValue: false,
              index: true,
              admin: {
                description:
                  "Used on the homepage only when Home Page -> Landing page projects is empty and \"Use featured projects when empty\" is enabled. Selecting projects there always takes precedence.",
              },
            },
            {
              name: "publishedAt",
              label: "Publish date",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
              },
            },
          ],
        },
        {
          label: "Media",
          description: "Choose images from the Media Library. Payload shows upload previews here, not just text chips.",
          fields: [
            {
              name: "thumbnail",
              label: "Featured image",
              type: "upload",
              relationTo: "media",
              displayPreview: true,
              admin: {
                description: "The main image for this project. Used in cards, previews, and landing page slides.",
                sortOptions: "-updatedAt",
              },
            },
            {
              name: "gallery",
              label: "Project gallery images",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              displayPreview: true,
              admin: {
                description: "Images shown in the project gallery. Captions are managed in the Image Library.",
                isSortable: true,
                sortOptions: "-updatedAt",
              },
            },
          ],
        },
        {
          label: "Legacy details",
          description:
            "Read-only migration fallback for older project detail fields. New edits should happen in Project body.",
          fields: [
            {
              name: "details",
              type: "group",
              admin: {
                readOnly: true,
              },
              fields: [
                {
                  name: "introduction",
                  type: "textarea",
                },
                {
                  name: "objective",
                  type: "textarea",
                },
                listField("approach", "Approach"),
                listField("implementation", "Implementation"),
                listField("outcomes", "Outcomes"),
                {
                  name: "takeaway",
                  type: "textarea",
                },
              ],
            },
          ],
        },
      ],
    },
    legacySeoField,
  ],
  hooks: {
    afterChange: [revalidateProject],
    afterDelete: [revalidateProjectDelete],
    beforeChange: [populatePublishedAt],
  },
}
