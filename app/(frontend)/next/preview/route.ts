import configPromise from "@payload-config"
import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { getPayload, type PayloadRequest } from "payload"

import type { PreviewSearchParams } from "@/lib/preview"

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get("path") as PreviewSearchParams["path"] | null
  const previewSecret = searchParams.get("previewSecret") as PreviewSearchParams["previewSecret"] | null
  const expectedSecret = process.env.PAYLOAD_PREVIEW_SECRET || (process.env.NODE_ENV === "production" ? "" : "1")

  if (!expectedSecret) {
    return new Response("Preview is not configured", { status: 503 })
  }
  if (previewSecret !== expectedSecret) {
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  if (!path) {
    return new Response("Insufficient search params", { status: 404 })
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return new Response("This endpoint can only be used for relative previews", { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  let authResult
  try {
    authResult = await payload.auth({
      headers: req.headers,
      req: req as unknown as PayloadRequest,
    })
  } catch (error) {
    payload.logger.error({ err: error }, "Error verifying token for live preview")
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  const draft = await draftMode()

  if (!authResult.user) {
    draft.disable()
    return new Response("You are not allowed to preview this page", { status: 403 })
  }

  draft.enable()
  redirect(path)
}
