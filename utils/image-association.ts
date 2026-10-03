import { ProjectImage, projectImages } from "@/data/project-images"

export { projectImages }
export type { ProjectImage }

/**
 * Get all images associated with a specific project
 */
export function getProjectImages(projectSlug: string): ProjectImage[] {
  return projectImages
    .filter((image) => image.projectSlug === projectSlug)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
}

/**
 * Get featured images for a specific project
 */
function getProjectFeaturedImages(projectSlug: string): ProjectImage[] {
  return projectImages
    .filter((image) => image.projectSlug === projectSlug && image.featured)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
}

/**
 * Get a single featured image for a project (for thumbnails)
 */
export function getProjectThumbnail(projectSlug: string): ProjectImage | undefined {
  // Try to get featured images first
  const featured = getProjectFeaturedImages(projectSlug)
  if (featured.length > 0) return featured[0]

  // Fallback to any image from the project
  const allImages = getProjectImages(projectSlug)
  return allImages.length > 0 ? allImages[0] : undefined
}
