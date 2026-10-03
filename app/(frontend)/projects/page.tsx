import { ProjectsClient } from "@/components/projects-client"
import { getAllProjectsWithThumbnails, getProjectCategories } from "@/lib/projects-cms"
import { getProjectsPageSettings } from "@/lib/projects-page"

// The global archive copy changes on save; keep project/media data cached by tag
// while rendering the route on demand so ISR does not serve an old shell once.
export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const [categories, projects, settings] = await Promise.all([
    getProjectCategories(),
    getAllProjectsWithThumbnails(),
    getProjectsPageSettings(),
  ])

  return <ProjectsClient categories={categories} projects={projects} settings={settings} />
}
