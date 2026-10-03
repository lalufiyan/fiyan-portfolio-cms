/**
 * Single source of truth for turning Payload media documents and static
 * `/projects/...` assets into the URL that should actually be rendered.
 *
 * Every surface has to request a pre-generated derivative on purpose: `thumb`
 * for listings and gallery tiles, `detail` for the project hero, `lightbox`
 * only once the lightbox is open. Never hand a listing the original upload.
 */


export type MediaRecord = {
  filename?: string
  prefix?: string
  sizes?: Record<string, { filename?: string; url?: string } | undefined>
  thumbnailURL?: string
  url?: string
}

const publicR2Url = process.env.R2_PUBLIC_URL?.replace(/\/$/, "")

export const asMediaRecord = (media: unknown): MediaRecord | undefined =>
  media && typeof media === "object" ? (media as MediaRecord) : undefined

const r2MediaUrl = (filename?: string, prefix?: string): string => {
  if (!filename || !publicR2Url) {
    return ""
  }

  return `${publicR2Url}/${prefix ? `${prefix}/` : ""}${filename}`
}

export const mediaUrl = (media: unknown): string => {
  const record = asMediaRecord(media)
  if (!record) {
    return ""
  }

  return record.url || record.thumbnailURL || r2MediaUrl(record.filename, record.prefix)
}

export const mediaSizeUrl = (media: unknown, sizeName: string): string => {
  const record = asMediaRecord(media)
  const size = record?.sizes?.[sizeName]

  if (!size) {
    return ""
  }

  return size.url || r2MediaUrl(size.filename, record?.prefix)
}

/**
 * Resolve the first available size in preference order, falling back to the
 * original upload.
 */
export const mediaSrc = (media: unknown, sizeNames: readonly string[]): string => {
  for (const sizeName of sizeNames) {
    const src = mediaSizeUrl(media, sizeName)
    if (src) {
      return src
    }
  }

  return mediaUrl(media)
}

export type ProjectMediaVariant = "detail" | "lightbox" | "thumb"

export interface ProjectImageSources {
  src: string
  thumbnailSrc?: string
  detailSrc?: string
  lightboxSrc?: string
}

/**
 * Static project media is pre-generated next to the originals:
 * `/projects/<slug>/<name>.webp` -> `/project-media/<slug>/<name>-<variant>.webp`.
 */
export const projectMediaVariantUrl = (src: string, variant: ProjectMediaVariant): string | undefined => {
  if (!src.startsWith("/projects/")) {
    return undefined
  }

  const parts = src.split("/")
  const projectSlug = parts[2]
  const filename = parts.at(-1)

  if (!projectSlug || !filename) {
    return undefined
  }

  const basename = filename.replace(/\.[^.]+$/, "")
  return `/project-media/${projectSlug}/${basename}-${variant}.webp`
}

/**
 * Attach the pre-generated variants to a static image without clobbering
 * variants a caller already resolved (idempotent for CMS media).
 */
export const withProjectImageVariants = <T extends ProjectImageSources>(image: T) => ({
  ...image,
  thumbnailSrc: image.thumbnailSrc || projectMediaVariantUrl(image.src, "thumb") || image.src,
  detailSrc: image.detailSrc || projectMediaVariantUrl(image.src, "detail") || image.src,
  lightboxSrc: image.lightboxSrc || projectMediaVariantUrl(image.src, "lightbox") || image.src,
})
