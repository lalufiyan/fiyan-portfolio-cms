// Smoke stub for lib/projects-cms: the homepage case drives both readers through globals so the
// real selection/fallback logic in lib/homepage-slides.ts is what gets exercised.
export const getLandingProjects = async () =>
  (globalThis as { __landingProjects?: unknown[] }).__landingProjects ?? []

export const getAllProjectsWithThumbnails = async () =>
  (globalThis as { __allProjects?: unknown[] }).__allProjects ?? []
