import { AdminBar } from "@/components/admin-bar"
import { HomeClient } from "@/components/home-client"
import { RefreshRouteOnSave } from "@/components/refresh-route-on-save"
import { getHomepageSlides } from "@/lib/homepage-slides"
import { isPreviewRequest } from "@/lib/preview"
import { draftMode } from "next/headers"

interface HomeProps {
  searchParams?: Promise<{
    preview?: string
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const query = await searchParams
  const draft = await draftMode()
  const isPreview = draft.isEnabled || isPreviewRequest(query?.preview)
  const cmsEnabled = Boolean(process.env.DATABASE_URL?.trim())
  const landingProjects = await getHomepageSlides({ draft: isPreview })

  return (
    <>
      {cmsEnabled && (
        <AdminBar
          collectionLabels={{ plural: "Portfolio Projects", singular: "Portfolio Project" }}
          collectionSlug="projects"
          preview={isPreview}
        />
      )}
      {isPreview && cmsEnabled && <RefreshRouteOnSave />}
      <HomeClient landingProjects={landingProjects} />
    </>
  )
}
