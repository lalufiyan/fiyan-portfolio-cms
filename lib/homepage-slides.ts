import {
  getAllProjectsWithThumbnails,
  getLandingProjects,
  type LandingProject,
} from "@/lib/projects-cms"
import { sortProjectsByYear } from "@/utils/category-utils"

/**
 * Homepage slide selection with a non-blank guarantee.
 *
 * `lib/projects-cms` deliberately reports an empty list when an editor cleared the slide selection
 * while "Use featured projects when empty" is off. Rendering that list would ship a blank landing
 * page, so the homepage degrades to the toggle-on behaviour instead: featured projects first, then
 * the whole project library. Editors get the matching inline warning and publish-time validation on
 * the Home Page global.
 */
export const getHomepageSlides = async (options: { draft?: boolean } = {}): Promise<LandingProject[]> => {
  const landingProjects = await getLandingProjects(options)

  if (landingProjects.length > 0) {
    return landingProjects
  }

  console.warn(
    "[homepage] No landing projects selected and the featured fallback is off; serving fallback slides so the landing page is not blank.",
  )

  const projects = await getAllProjectsWithThumbnails()
  const featured = projects.filter((project) => project.featured)
  const slides = featured.length > 0 ? featured : projects

  return sortProjectsByYear(
    slides.map((project) => ({
      ...project,
      images: [
        {
          id: project.slug,
          src: project.thumbnailUrl,
          alt: project.title,
          projectSlug: project.slug,
          thumbnailSrc: project.thumbnailUrl,
          detailSrc: project.thumbnailUrl,
        },
      ],
    })),
  )
}
