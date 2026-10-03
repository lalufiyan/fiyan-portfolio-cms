"use client"

import { useEffect } from "react"

/**
 * Payload live preview loads the site inside the admin iframe with `?previewMode=live`.
 * Reading that flag on the client keeps the layout free of request-time APIs such as
 * `headers()`, so pages in this route group can stay statically rendered.
 *
 * The sidebar itself is hidden with CSS via the `data-preview-live` attribute.
 */
export function PreviewLiveMode() {
  useEffect(() => {
    const isLive = new URLSearchParams(window.location.search).get("previewMode") === "live"

    document.documentElement.toggleAttribute("data-preview-live", isLive)
  }, [])

  return null
}
