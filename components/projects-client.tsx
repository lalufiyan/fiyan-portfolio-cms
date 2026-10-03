"use client"

import { useState } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import type { ProjectWithThumbnail } from "@/lib/projects-cms"
import type { ProjectsPageSettings } from "@/lib/projects-page"
import { projectMatchesCategory, sortProjectsByYear } from "@/utils/category-utils"

interface ProjectsClientProps {
  categories: string[]
  projects: ProjectWithThumbnail[]
  settings: ProjectsPageSettings
}

const formatCategory = (category: string) =>
  category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)

export function ProjectsClient({ categories, projects, settings }: ProjectsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredProjects = sortProjectsByYear(
    selectedCategory === "all"
      ? projects
      : projects.filter((project) => projectMatchesCategory(project.category, selectedCategory)),
  )

  return (
    <section className="min-h-screen bg-white px-5 py-14 text-neutral-950 sm:px-6 lg:px-20 lg:py-20">
      <div className="max-w-[1400px]">
        <div className="mb-10 max-w-4xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-2 text-base font-semibold text-neutral-700 transition hover:bg-neutral-200 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm"
          >
            <ArrowLeft className="size-5 sm:size-4" aria-hidden="true" />
            Home
          </Link>
          <p className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-neutral-400 sm:text-xs">
            {settings.eyebrow}
          </p>
          <h1 className="mb-5 max-w-[12ch] text-balance text-5xl font-semibold tracking-tight text-black sm:text-6xl">
            {settings.heading}
          </h1>
          <p className="max-w-[62ch] text-lg text-pretty text-neutral-600 sm:text-base">{settings.description}</p>
        </div>

        <div className="mb-10 flex max-w-full flex-wrap gap-2" aria-label="Filter projects by category">
          {categories.map((category) => {
            const isSelected = selectedCategory === category

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={isSelected}
                className={`max-w-full rounded-full px-3 py-2 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm ${
                  isSelected
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black"
                }`}
              >
                <span className="block break-words text-left">{formatCategory(category)}</span>
              </button>
            )
          })}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="border-t border-neutral-950/10 py-14">
            <p className="max-w-[48ch] text-base text-neutral-600 sm:text-sm">
              No projects match this category yet. Choose another filter to continue browsing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <article
                key={project.id}
                className="group h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${Math.min(index * 25, 180)}ms` }}
              >
                <Link
                  href={`/projects/${project.slug}`}
                  className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-950/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-neutral-950/20 hover:shadow-[0_18px_45px_rgba(15,15,15,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    <Image
                      src={project.thumbnailUrl || "/placeholder.svg"}
                      alt=""
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.035]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-base font-medium text-neutral-500 sm:text-sm">
                      <span className="break-words">{project.category}</span>
                      {project.year && <span>{project.year}</span>}
                    </div>
                    <h2 className="mb-3 max-w-[18ch] text-balance text-2xl font-semibold tracking-tight text-black">
                      {project.title}
                    </h2>
                    <p className="mb-5 line-clamp-3 text-base text-pretty text-neutral-600 sm:text-sm">
                      {project.description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 text-base font-semibold text-black sm:text-sm">
                      View Project
                      <ArrowUpRight className="size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:size-4" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
