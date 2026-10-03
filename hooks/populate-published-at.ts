import type { CollectionBeforeChangeHook } from "payload"

/**
 * Stamps `publishedAt` when a document is actually published, and only then.
 *
 * A draft that is merely saved (including autosave) must not carry a publish
 * date, and republishing a document that already has one must keep the original
 * date. Unpublishing leaves the previous date in place.
 */
export const populatePublishedAt: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation !== "create" && operation !== "update") {
    return data
  }

  const nextStatus = data?._status ?? originalDoc?._status

  if (nextStatus !== "published") {
    return data
  }

  const existing = data?.publishedAt ?? originalDoc?.publishedAt

  if (existing) {
    return data
  }

  return {
    ...data,
    publishedAt: new Date().toISOString(),
  }
}
