/**
 * Utility functions for handling project categories
 */

/**
 * Normalizes a category string for consistent comparison
 * Trims whitespace and converts to lowercase
 */
function normalizeCategory(category: string): string {
  return category.trim().toLowerCase()
}

/**
 * Checks if a project belongs to a specific category
 * Uses normalized comparison for consistency
 */
export function projectMatchesCategory(projectCategory: string, selectedCategory: string): boolean {
  return normalizeCategory(projectCategory) === normalizeCategory(selectedCategory)
}

/**
 * Extract the final year from a year range or single year string
 * e.g., "2023-2024" returns 2024, "2025" returns 2025
 */
function extractFinalYear(yearString: string): number {
  if (!yearString) return 0
  const years = yearString.split("-").map((y) => Number.parseInt(y.trim(), 10))
  return years[years.length - 1]
}

/**
 * Sort projects by year in descending order (most recent first)
 */
export function sortProjectsByYear<T extends { year: string }>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    const yearA = extractFinalYear(a.year)
    const yearB = extractFinalYear(b.year)
    return yearB - yearA // Descending order
  })
}
