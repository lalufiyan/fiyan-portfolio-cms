export type PreviewSearchParams = {
  path: string
  previewSecret: string
}

export type PreviewMode = "live"

const previewSecret = () => process.env.PAYLOAD_PREVIEW_SECRET || (process.env.NODE_ENV === "production" ? "" : "1")

const appendPreviewMode = (path: string, previewMode?: PreviewMode) => {
  if (!previewMode) {
    return path
  }

  const [pathname, search = ""] = path.split("?")
  const searchParams = new URLSearchParams(search)
  searchParams.set("previewMode", previewMode)

  return `${pathname}?${searchParams.toString()}`
}

export const generatePreviewPath = (path: string, options: { previewMode?: PreviewMode } = {}) => {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || !previewSecret()) {
    return null
  }

  const encodedParams = new URLSearchParams({
    path: appendPreviewMode(path, options.previewMode),
    previewSecret: previewSecret(),
  } satisfies PreviewSearchParams)

  return `/next/preview?${encodedParams.toString()}`
}

export const isPreviewRequest = (preview?: string) => {
  const secret = process.env.PAYLOAD_PREVIEW_SECRET

  if (secret) {
    return preview === secret
  }

  return process.env.NODE_ENV !== "production" && (preview === "1" || preview === "true")
}
