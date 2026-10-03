import { revalidatePath, revalidateTag } from "next/cache"
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload"

import { CACHE_TAGS } from "@/lib/cache-tags"

type RevalidationContext = {
  disableRevalidate?: boolean
}

const shouldSkipRevalidate = (context: unknown) => Boolean((context as RevalidationContext | undefined)?.disableRevalidate)

const revalidatePaths = (paths: string[]) => {
  for (const path of paths) {
    revalidatePath(path)
  }
}

const revalidateTags = (tags: string[]) => {
  for (const tag of tags) {
    // Next 16 requires an explicit revalidation behaviour. Payload hooks run inside
    // route handlers, so `updateTag` is not available and `{ expire: 0 }` is the
    // documented way to expire cached entries immediately after an editor saves.
    revalidateTag(tag, { expire: 0 })
  }
}

const projectPath = (slug?: unknown) => (typeof slug === "string" && slug ? `/projects/${slug}` : undefined)
const articlePath = (slug?: unknown) => (typeof slug === "string" && slug ? `/articles/${slug}` : undefined)

export const revalidateProject: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  // Admin creation auto-saves an empty draft during render. No public page
  // changed, and Next rejects revalidation inside that render.
  if (
    shouldSkipRevalidate(req.context) ||
    (doc?._status !== "published" && previousDoc?._status !== "published")
  ) {
    return doc
  }

  const paths = ["/", "/projects"]
  const currentPath = projectPath(doc?.slug)
  const oldPath = projectPath(previousDoc?.slug)

  if (currentPath && doc?._status === "published") {
    paths.push(currentPath)
  }

  if (oldPath && oldPath !== currentPath && previousDoc?._status === "published") {
    paths.push(oldPath)
  }

  revalidatePaths(paths)
  revalidateTags([CACHE_TAGS.projects])
  return doc
}

export const revalidateProjectDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (shouldSkipRevalidate(req.context)) {
    return doc
  }

  revalidatePaths(["/", "/projects", projectPath(doc?.slug)].filter((path): path is string => Boolean(path)))
  revalidateTags([CACHE_TAGS.projects])
  return doc
}

export const revalidateArticle: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  // Draft-only article saves have the same render-time autosave behavior.
  if (
    shouldSkipRevalidate(req.context) ||
    (doc?._status !== "published" && previousDoc?._status !== "published")
  ) {
    return doc
  }

  const paths = ["/"]
  const currentPath = articlePath(doc?.slug)
  const oldPath = articlePath(previousDoc?.slug)

  if (currentPath && doc?._status === "published") {
    paths.push(currentPath)
  }

  if (oldPath && oldPath !== currentPath && previousDoc?._status === "published") {
    paths.push(oldPath)
  }

  revalidatePaths(paths)
  return doc
}

export const revalidateArticleDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (shouldSkipRevalidate(req.context)) {
    return doc
  }

  revalidatePaths(["/", articlePath(doc?.slug)].filter((path): path is string => Boolean(path)))
  return doc
}

export const revalidateMedia: CollectionAfterChangeHook = ({ doc, req }) => {
  if (shouldSkipRevalidate(req.context)) {
    return doc
  }

  revalidatePaths(["/", "/projects"])
  revalidateTags([CACHE_TAGS.projects])
  return doc
}

export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc, req }) => {
  if (shouldSkipRevalidate(req.context)) {
    return doc
  }

  revalidatePaths(["/", "/projects", "/sitemap.xml", "/robots.txt"])
  return doc
}

export const revalidateHomePage: GlobalAfterChangeHook = ({ doc, req }) => {
  if (shouldSkipRevalidate(req.context)) {
    return doc
  }

  revalidatePaths(["/"])
  revalidateTags([CACHE_TAGS.projects])
  return doc
}
