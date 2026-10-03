import path from "path"
import { fileURLToPath } from "url"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { redirectsPlugin } from "@payloadcms/plugin-redirects"
import { seoPlugin } from "@payloadcms/plugin-seo"
import type { GenerateDescription, GenerateImage, GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types"
import { s3Storage } from "@payloadcms/storage-s3"
import { buildConfig, type PayloadRequest } from "payload"
import sharp from "sharp"

import { Articles } from "./collections/Articles.ts"
import { Media } from "./collections/Media.ts"
import { Projects } from "./collections/Projects.ts"
import { Users } from "./collections/Users.ts"
import { HomePage } from "./globals/HomePage.ts"
import { ProjectsPage } from "./globals/ProjectsPage.ts"
import { SiteSettings } from "./globals/SiteSettings.ts"
import { authenticated, publicRead } from "./collections/access.ts"
import { richTextEditor } from "./lib/payload-rich-text-editor.ts"
import { absoluteURL } from "./lib/site-url.ts"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = process.env

const DEV_PAYLOAD_SECRET = "dev-only-payload-secret-change-me"

// Local development can render the static fallback without a database.
const cmsEnabled = Boolean(env.DATABASE_URL?.trim())

const r2Bucket = env.R2_BUCKET?.trim() || ""
const r2Endpoint = env.R2_ENDPOINT?.trim() || ""
const r2AccessKeyId = env.R2_ACCESS_KEY_ID?.trim() || ""
const r2SecretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || ""
const r2PublicUrl = env.R2_PUBLIC_URL?.trim() || ""

const r2StorageEnabled = Boolean(r2Bucket && r2Endpoint && r2AccessKeyId && r2SecretAccessKey)
const isProduction = env.NODE_ENV === "production"

// CI explicitly opts into a credential-free static build. Next does not expose
// a reliable build-phase marker in every page-data worker, so deployment and
// runtime processes otherwise share the same strict production validation.
const isStaticCiBuild = Boolean(env.CI) && env.CMS_STATIC_BUILD === "1" && !env.VERCEL && !cmsEnabled

if (isProduction && !isStaticCiBuild) {
  if (env.PAYLOAD_SECRET === DEV_PAYLOAD_SECRET) {
    throw new Error("PAYLOAD_SECRET is still the development placeholder. Generate a real secret before deploying.")
  }

  const missing = [
    ["DATABASE_URL", env.DATABASE_URL],
    ["PAYLOAD_SECRET", env.PAYLOAD_SECRET],
    ["NEXT_PUBLIC_SITE_URL", env.NEXT_PUBLIC_SITE_URL],
    ["R2_BUCKET", r2Bucket],
    ["R2_ENDPOINT", r2Endpoint],
    ["R2_ACCESS_KEY_ID", r2AccessKeyId],
    ["R2_SECRET_ACCESS_KEY", r2SecretAccessKey],
    ["R2_PUBLIC_URL", r2PublicUrl],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`)
  }
}

// A partially configured R2 silently drops media on local disk, which is hard to spot.
if (!r2StorageEnabled && (r2Bucket || r2Endpoint || r2AccessKeyId || r2SecretAccessKey)) {
  console.warn(
    "[payload.config] Partial R2 configuration: set R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY to store media in R2. Falling back to local uploads.",
  )
}

const titleFromDoc = (doc: unknown) => {
  if (!doc || typeof doc !== "object") {
    return undefined
  }

  const record = doc as { title?: unknown }
  return typeof record.title === "string" && record.title ? record.title : undefined
}

const descriptionFromDoc = (doc: unknown) => {
  if (!doc || typeof doc !== "object") {
    return undefined
  }

  const record = doc as { description?: unknown }
  return typeof record.description === "string" && record.description ? record.description : undefined
}

const slugFromDoc = (doc: unknown) => {
  if (!doc || typeof doc !== "object") {
    return undefined
  }

  const record = doc as { slug?: unknown }
  return typeof record.slug === "string" && record.slug ? record.slug : undefined
}

const imageIDFromValue = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") {
    return value
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === "number" || typeof id === "string" ? id : undefined
  }

  return undefined
}

const generateTitle: GenerateTitle = ({ doc }) => {
  const title = titleFromDoc(doc)
  return title ? `${title} | Lalu Fityan Portfolio` : "Lalu Fityan Portfolio"
}

const generateDescription: GenerateDescription = ({ doc }) =>
  descriptionFromDoc(doc) ||
  "Strategic communications, project management, campaign, event, and creative direction portfolio by Lalu Fityan."

const generateImage: GenerateImage = ({ doc }) => {
  if (!doc || typeof doc !== "object") {
    return ""
  }

  const record = doc as { featuredImage?: unknown; thumbnail?: unknown }
  return imageIDFromValue(record.thumbnail) || imageIDFromValue(record.featuredImage) || ""
}

const generateURL: GenerateURL = ({ collectionConfig, doc }) => {
  const slug = slugFromDoc(doc)

  if (collectionConfig?.slug === "projects" && slug) {
    return absoluteURL(`/projects/${slug}`)
  }

  if (collectionConfig?.slug === "articles" && slug) {
    return absoluteURL(`/articles/${slug}`)
  }

  return absoluteURL("/")
}

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Projects, Articles],
  globals: [HomePage, SiteSettings, ProjectsPage],
  editor: richTextEditor,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL?.trim() || "postgres://payload:payload@127.0.0.1:5432/fiyan_portfolio",
    },
  }),
  plugins: [
    redirectsPlugin({
      collections: ["projects", "articles"],
      overrides: {
        access: {
          create: authenticated,
          delete: authenticated,
          read: publicRead,
          update: authenticated,
        },
        admin: {
          defaultColumns: ["from", "to.type", "type", "updatedAt"],
          group: "Site",
        },
      },
      redirectTypes: ["301", "302", "307", "308"],
    }),
    seoPlugin({
      collections: ["projects", "articles"],
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: "noIndex",
          label: "Hide from search engines",
          type: "checkbox",
          defaultValue: false,
        },
      ],
      generateDescription,
      generateImage,
      generateTitle,
      generateURL,
      tabbedUI: true,
      uploadsCollection: "media",
    }),
    s3Storage({
      enabled: r2StorageEnabled,
      collections: {
        media: {
          prefix: "portfolio",
        },
      },
      clientUploads: true,
      bucket: r2Bucket || "missing-r2-bucket",
      config: {
        credentials: {
          accessKeyId: r2AccessKeyId || "missing-r2-access-key",
          secretAccessKey: r2SecretAccessKey || "missing-r2-secret-key",
        },
        endpoint: r2Endpoint,
        forcePathStyle: true,
        region: "auto",
      },
    }),
  ],
  secret: env.PAYLOAD_SECRET || DEV_PAYLOAD_SECRET,
  folders: {
    fieldName: "payloadFolder",
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }) => {
        if (req.user) {
          return true
        }

        const secret = process.env.CRON_SECRET
        return Boolean(secret && req.headers.get("authorization") === `Bearer ${secret}`)
      },
    },
    tasks: [],
  },
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
})
