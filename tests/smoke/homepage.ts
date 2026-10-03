// Drives the real homepage slide selection through stub readers: a cleared selection with the
// featured fallback off must never produce a blank landing page.
import { getHomepageSlides } from "../../lib/homepage-slides"
import type { LandingProject } from "../../lib/projects-cms"
import { check, finish } from "./assert"

const project = (slug: string, featured: boolean, year: string) => ({
  id: slug,
  slug,
  title: slug,
  description: `${slug} description`,
  category: "Category",
  year,
  featured,
  image: "",
  thumbnailUrl: `https://media.example.com/portfolio/${slug}-thumb.webp`,
})

const slidesFor = (landing: unknown[], all: unknown[]): Promise<LandingProject[]> => {
  ;(globalThis as Record<string, unknown>).__landingProjects = landing
  ;(globalThis as Record<string, unknown>).__allProjects = all

  return getHomepageSlides()
}

const main = async () => {
  console.log("homepage slide selection")

  const curated = await slidesFor([{ slug: "curated", images: [] }], [project("featured-a", true, "2025")])
  check(
    "a curated selection is returned untouched",
    curated.length === 1 && curated[0]!.slug === "curated",
    JSON.stringify(curated.map((slide) => slide.slug)),
  )

  const guarded = await slidesFor(
    [],
    [project("featured-b", true, "2025"), project("featured-a", true, "2026"), project("other", false, "2024")],
  )
  check("an empty selection is never blank", guarded.length === 2, JSON.stringify(guarded.map((slide) => slide.slug)))
  check(
    "featured projects are preferred over the whole library",
    guarded.every((slide) => slide.slug.startsWith("featured-")),
    JSON.stringify(guarded.map((slide) => slide.slug)),
  )
  check(
    "guarded slides stay ordered newest first",
    guarded[0]!.slug === "featured-a",
    JSON.stringify(guarded.map((slide) => slide.slug)),
  )
  check(
    "guarded slides carry a renderable image",
    guarded[0]!.images[0]?.src === "https://media.example.com/portfolio/featured-a-thumb.webp",
    JSON.stringify(guarded[0]!.images),
  )

  const noFeatured = await slidesFor([], [project("only", false, "2025")])
  check(
    "the library is used when nothing is featured",
    noFeatured.length === 1 && noFeatured[0]!.slug === "only",
    JSON.stringify(noFeatured.map((slide) => slide.slug)),
  )

  finish()
}

void main()
