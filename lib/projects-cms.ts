import configPromise from "@payload-config"
import { getPayload } from "payload"
import { unstable_cache } from "next/cache"
import { cache } from "react"

import {
  getFeaturedProjects as getStaticFeaturedProjects,
  getProjectBySlug as getStaticProjectBySlug,
  getProjectCategories as getStaticProjectCategories,
  projects as staticProjects,
  type Project as StaticProject,
} from "@/data/projects"
import {
  getProjectImages as getStaticProjectImages,
  getProjectThumbnail as getStaticProjectThumbnail,
  projectImages as staticProjectImages,
  type ProjectImage as StaticProjectImage,
} from "@/utils/image-association"
import { sortProjectsByYear } from "@/utils/category-utils"
import { type ProjectRichText } from "@/lib/project-rich-text"
import { CACHE_TAGS } from "@/lib/cache-tags"
import {
  asMediaRecord,
  mediaSizeUrl,
  mediaSrc,
  mediaUrl,
  projectMediaVariantUrl,
  withProjectImageVariants,
} from "@/lib/media-url"

export interface Project {
  id: number | string
  title: string
  description: string
  category: string
  image: string
  slug: string
  year: string
  role?: string
  client?: string
  content?: ProjectRichText
  details?: StaticProject["details"]
  featured?: boolean
  seo?: ProjectSEO
}

interface ProjectSEO {
  canonicalUrl?: string
  description?: string
  image?: string
  noIndex?: boolean
  title?: string
}

export interface ProjectImage extends StaticProjectImage {
  detailSrc?: string
  lightboxSrc?: string
  thumbnailSrc?: string
}

export interface ProjectWithThumbnail extends Project {
  thumbnailUrl: string
}

export interface LandingProject extends Project {
  images: ProjectImage[]
  thumbnail?: ProjectImage
}

const cmsEnabled = Boolean(process.env.DATABASE_URL?.trim())
const optimizedProjectThumbnailBySlug = new Map<string, string>([
  ["amok-research", "/project-thumbnails/amok-research.webp"],
  ["balakosa-coffee", "/project-thumbnails/balakosa-coffee.webp"],
  ["busfi-arusagara-campaign", "/project-thumbnails/busfi-arusagara-campaign.webp"],
  ["explore-lombok", "/project-thumbnails/explore-lombok.webp"],
  ["fornas-viii-ntb-2025", "/project-thumbnails/fornas-viii-ntb-2025.webp"],
  ["hikayat-ampenan", "/project-thumbnails/hikayat-ampenan.webp"],
  ["hotel", "/project-thumbnails/hotel.webp"],
  ["iqbal-dinda-campaign", "/project-thumbnails/iqbal-dinda-campaign.webp"],
  ["kinta", "/project-thumbnails/kinta.webp"],
  ["loka", "/project-thumbnails/loka.webp"],
  ["paragliding-accuracy-world-cup-2025", "/project-thumbnails/paragliding-accuracy-world-cup-2025.webp"],
  ["resto-kenangan", "/project-thumbnails/resto-kenangan.webp"],
  ["royal-batu-bolong", "/project-thumbnails/royal-batu-bolong.webp"],
  ["siglo-sky-lounge", "/project-thumbnails/siglo-sky-lounge.webp"],
  ["smcp", "/project-thumbnails/smcp.webp"],
  ["switch-on-creative", "/project-thumbnails/switch-on-creative.webp"],
  ["world-field-archery-2025", "/project-thumbnails/world-field-archery-2025.webp"],
])
const staticImageByFilename = new Map(
  staticProjectImages.map((image) => {
    const filename = image.src.split("/").pop() || image.src
    return [filename, image.src] as const
  }),
)

const rowText = (rows: unknown): string[] | undefined => {
  if (!Array.isArray(rows)) {
    return undefined
  }

  return rows
    .map((row) => (typeof row === "object" && row && "text" in row ? String(row.text) : ""))
    .filter(Boolean)
}

const staticMediaUrl = (record: { filename?: string; url?: string }) => {
  const filename = record.filename || record.url?.split("/").pop()

  return filename ? staticImageByFilename.get(filename) : undefined
}

/**
 * Static seed media lives in `public/projects/...`; the CMS stores it by
 * filename, so resolve the static path before any CMS/R2 URL.
 */
const staticAwareMediaUrl = (media: unknown): string => {
  const record = asMediaRecord(media)

  return (record ? staticMediaUrl(record) : undefined) || mediaUrl(media)
}

const optimizedProjectThumbnailUrl = (projectSlug: string) => optimizedProjectThumbnailBySlug.get(projectSlug)

const seoMediaUrl = (media: unknown): string => mediaSrc(media, ["og", "detail"]) || staticAwareMediaUrl(media)

const toSEO = (seo: unknown): ProjectSEO | undefined => {
  if (!seo || typeof seo !== "object") {
    return undefined
  }

  const record = seo as {
    canonicalUrl?: string
    description?: string
    image?: unknown
    noIndex?: boolean
    title?: string
  }
  const result: ProjectSEO = {
    canonicalUrl: record.canonicalUrl || undefined,
    description: record.description || undefined,
    image: seoMediaUrl(record.image) || undefined,
    noIndex: Boolean(record.noIndex),
    title: record.title || undefined,
  }

  return Object.values(result).some(Boolean) ? result : undefined
}

const toProjectImage = (media: unknown, projectSlug: string, index = 0): ProjectImage | null => {
  if (!media || typeof media !== "object") {
    return null
  }

  const record = media as {
    id: string | number
    alt?: string
    caption?: string
    description?: string
    featured?: boolean
    filename?: string
    mimeType?: string
    order?: number
    sizes?: Record<string, { filename?: string; url?: string }>
    thumbnailURL?: string
    url?: string
  }

  const src = staticAwareMediaUrl(record)
  if (!src) {
    return null
  }
  const staticSrc = staticMediaUrl(record)
  const staticThumbnailSrc = staticSrc ? projectMediaVariantUrl(staticSrc, "thumb") : undefined
  const staticDetailSrc = staticSrc ? projectMediaVariantUrl(staticSrc, "detail") : undefined
  const staticLightboxSrc = staticSrc ? projectMediaVariantUrl(staticSrc, "lightbox") : undefined

  return {
    id: String(record.id),
    src,
    alt: record.alt || record.caption || record.filename || projectSlug,
    caption: record.caption,
    description: record.description,
    thumbnailSrc: mediaSizeUrl(record, "gallery") || staticThumbnailSrc || mediaSizeUrl(record, "thumbnail") || record.thumbnailURL || src,
    detailSrc: mediaSizeUrl(record, "detail") || staticDetailSrc || mediaSizeUrl(record, "lightbox") || staticLightboxSrc || src,
    lightboxSrc: mediaSizeUrl(record, "lightbox") || staticLightboxSrc || mediaSizeUrl(record, "detail") || staticDetailSrc || src,
    projectSlug,
    featured: Boolean(record.featured),
    type: record.mimeType?.startsWith("video/") ? "video" : "image",
    order: record.order ?? index + 1,
  }
}

const toProject = (doc: any): Project => ({
  id: doc.id,
  title: doc.title,
  description: doc.description,
  category: typeof doc.category === "string" ? doc.category : "",
  image: staticAwareMediaUrl(doc.thumbnail),
  slug: doc.slug,
  year: doc.year,
  role: doc.role || undefined,
  client: doc.client || undefined,
  content: doc.content || undefined,
  featured: Boolean(doc.featured),
  seo: toSEO(doc.meta || doc.seo),
  details: doc.details
    ? {
        introduction: doc.details.introduction || undefined,
        objective: doc.details.objective || undefined,
        approach: rowText(doc.details.approach),
        implementation: rowText(doc.details.implementation),
        outcomes: rowText(doc.details.outcomes),
        takeaway: doc.details.takeaway || undefined,
      }
    : undefined,
})

const toProjectWithThumbnail = (doc: any): ProjectWithThumbnail => {
  const project = toProject(doc)
  const thumbnail = toProjectImage(doc.thumbnail, project.slug)

  return {
    ...project,
    // Listing surface: the static card thumbnail, then the CMS gallery/thumbnail
    // derivative. The full-resolution original is only a last resort.
    thumbnailUrl:
      optimizedProjectThumbnailUrl(project.slug) ||
      thumbnail?.thumbnailSrc ||
      project.image ||
      "/placeholder.svg",
  }
}

const toLandingProject = (doc: any): LandingProject => {
  const project = toProject(doc)
  const thumbnail = toProjectImage(doc.thumbnail, project.slug) || undefined
  const gallery: unknown[] = Array.isArray(doc.gallery) ? doc.gallery : []
  const images = gallery
    .map((media: unknown, index: number) => toProjectImage(media, doc.slug, index))
    .filter((image): image is ProjectImage => Boolean(image))

  return {
    ...project,
    thumbnail,
    images: images.length > 0 ? images : thumbnail ? [thumbnail] : [],
  }
}

const getPayloadClient = async () => getPayload({ config: configPromise })

const getStaticLandingProjects = (): LandingProject[] =>
  sortProjectsByYear(getStaticFeaturedProjects()).map((project) => {
    const thumbnail = getStaticProjectThumbnail(project.slug)
    const optimizedThumbnail = thumbnail ? withProjectImageVariants(thumbnail) : undefined
    const images = getStaticProjectImages(project.slug).map(withProjectImageVariants)

    return {
      ...project,
      image: thumbnail?.src || project.image || "",
      thumbnail: optimizedThumbnail,
      images: images.length > 0 ? images : optimizedThumbnail ? [optimizedThumbnail] : [],
    }
  })

const getStaticProjectsWithThumbnails = (): ProjectWithThumbnail[] =>
  staticProjects.map((project) => {
    const thumbnail = getStaticProjectThumbnail(project.slug)

    return {
      ...project,
      thumbnailUrl:
        optimizedProjectThumbnailUrl(project.slug) ||
        (thumbnail ? projectMediaVariantUrl(thumbnail.src, "thumb") : undefined) ||
        thumbnail?.src ||
        project.image ||
        "/placeholder.svg",
    }
  })

const getStaticProjectWithImagesBySlug = (
  slug: string,
): { images: ProjectImage[]; project: Project } | undefined => {
  const project = getStaticProjectBySlug(slug)

  return project ? { project, images: getStaticProjectImages(slug).map(withProjectImageVariants) } : undefined
}

const readAllProjects = async (): Promise<Project[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: "projects",
    depth: 2,
    limit: 100,
    sort: "-year",
  })

  return result.docs.length > 0 ? result.docs.map(toProject) : staticProjects
}

const cachedAllProjects = unstable_cache(readAllProjects, ["projects:all"], { tags: [CACHE_TAGS.projects] })

export const getAllProjects = cache(async (): Promise<Project[]> => {
  if (!cmsEnabled) {
    return staticProjects
  }

  return cachedAllProjects()
})

const readLandingProjects = async (draft: boolean): Promise<LandingProject[]> => {
  const payload = await getPayloadClient()
  const homePage = (await payload.findGlobal({
    slug: "home-page",
    draft,
    depth: 2,
    overrideAccess: draft,
  })) as {
    fallbackToFeatured?: boolean | null
    landingProjects?: unknown[]
  }
  const selectedProjects = Array.isArray(homePage.landingProjects)
    ? homePage.landingProjects
        .filter((project): project is Record<string, unknown> => Boolean(project && typeof project === "object"))
        .map(toLandingProject)
    : []

  if (selectedProjects.length > 0) {
    return selectedProjects
  }

  if (homePage.fallbackToFeatured === false) {
    return []
  }

  const result = await payload.find({
    collection: "projects",
    draft,
    depth: 2,
    limit: 100,
    overrideAccess: draft,
    where: {
      featured: {
        equals: true,
      },
    },
  })

  return result.docs.length > 0 ? sortProjectsByYear(result.docs.map(toLandingProject)) : getStaticLandingProjects()
}

// Keep the editor's ordered slide selection request-local. Next's persistent tag
// cache can serve one stale homepage render after a Payload route-handler save.
const getLandingProjectsByDraft = cache(async (draft: boolean): Promise<LandingProject[]> => {
  if (!cmsEnabled) {
    return getStaticLandingProjects()
  }

  return readLandingProjects(draft)
})

export const getLandingProjects = (options: { draft?: boolean } = {}) =>
  getLandingProjectsByDraft(Boolean(options.draft))

const readAllProjectsWithThumbnails = async (): Promise<ProjectWithThumbnail[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: "projects",
    depth: 2,
    limit: 100,
  })

  return result.docs.length > 0 ? result.docs.map(toProjectWithThumbnail) : getStaticProjectsWithThumbnails()
}

const cachedAllProjectsWithThumbnails = unstable_cache(readAllProjectsWithThumbnails, ["projects:thumbnails"], {
  tags: [CACHE_TAGS.projects],
})

export const getAllProjectsWithThumbnails = cache(async (): Promise<ProjectWithThumbnail[]> => {
  if (!cmsEnabled) {
    return getStaticProjectsWithThumbnails()
  }

  return cachedAllProjectsWithThumbnails()
})

const readProjectWithImagesBySlug = async (
  slug: string,
  draft: boolean,
): Promise<{ images: ProjectImage[]; project: Project } | undefined> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: "projects",
    draft,
    depth: 2,
    limit: 1,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const doc = result.docs[0] as any
  if (!doc) {
    return getStaticProjectWithImagesBySlug(slug)
  }

  const gallery: unknown[] = Array.isArray(doc.gallery) ? doc.gallery : []
  return {
    project: toProject(doc),
    images: gallery
      .map((media: unknown, index: number) => toProjectImage(media, doc.slug, index))
      .filter((image): image is ProjectImage => Boolean(image)),
  }
}

const readPublishedProjectWithImagesBySlug = (slug: string) => readProjectWithImagesBySlug(slug, false)

const cachedProjectWithImagesBySlug = unstable_cache(readPublishedProjectWithImagesBySlug, ["projects:with-images"], {
  tags: [CACHE_TAGS.projects],
})

const getProjectWithImagesByDraft = cache(
  async (slug: string, draft: boolean): Promise<{ images: ProjectImage[]; project: Project } | undefined> => {
    if (!cmsEnabled) {
      return getStaticProjectWithImagesBySlug(slug)
    }

    return draft ? readProjectWithImagesBySlug(slug, true) : cachedProjectWithImagesBySlug(slug)
  },
)

export const getProjectWithImagesBySlug = (slug: string, options: { draft?: boolean } = {}) =>
  getProjectWithImagesByDraft(slug, Boolean(options.draft))

export const getProjectCategories = cache(async (): Promise<string[]> => {
  if (!cmsEnabled) {
    return getStaticProjectCategories()
  }

  const projects = await getAllProjects()
  const categories = Array.from(
    new Set(
      projects
        .map((project) => (typeof project.category === "string" ? project.category.trim() : ""))
        .filter(Boolean),
    ),
  )
  return ["all", ...categories.sort()]
})
