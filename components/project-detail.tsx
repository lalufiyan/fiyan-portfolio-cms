import { ArrowLeft, ArrowRight, Building, Calendar, Mail, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { fallbackSiteSettings } from "@/lib/site-settings"
import { projectMediaVariantUrl } from "@/lib/media-url"
import { ProjectRichTextRenderer } from "@/components/project-rich-text-renderer"
import { ProjectGallery } from "@/components/ui/project-gallery"
import { hasRichTextContent } from "@/lib/project-rich-text"
import type { Project, ProjectImage } from "@/lib/projects-cms"
import { getProjectImages } from "@/utils/image-association"

interface ProjectDetailProps {
  contactEmail?: string
  project: Project
  images?: ProjectImage[]
}

function TextSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="border-t border-neutral-950/10 pt-8">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight text-black">{title}</h2>
      {children}
    </section>
  )
}

function DetailList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="grid grid-cols-[auto_1fr] gap-3 text-base text-pretty text-neutral-700 sm:text-sm">
          <span className="mt-2 size-1.5 rounded-full bg-black" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function ProjectDetail({ contactEmail, project, images: cmsImages }: ProjectDetailProps) {
  const email = contactEmail || fallbackSiteSettings.email
  const images = cmsImages ?? getProjectImages(project.slug)
  const heroImage = images[0]
  const secondaryImages = images.slice(1)
  const metaItems = [
    { icon: Calendar, label: "Year", value: project.year },
    { icon: User, label: "Role", value: project.role },
    { icon: Building, label: "Client", value: project.client },
  ].filter((item) => item.value)

  return (
    <article className="min-h-screen bg-white px-5 py-14 text-neutral-950 sm:px-6 lg:px-20 lg:py-20">
      <div className="max-w-[1400px]">
        <Link
          href="/projects"
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-2 text-base font-semibold text-neutral-700 transition hover:bg-neutral-200 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-sm"
        >
          <ArrowLeft className="size-5 sm:size-4" aria-hidden="true" />
          Projects
        </Link>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
          <div className="min-w-0">
            <header className="mb-12">
              <div className="mb-3 flex max-w-full flex-wrap gap-2">
                <span className="max-w-full rounded-full bg-neutral-100 px-3 py-1.5 font-mono text-sm font-semibold uppercase tracking-wide text-neutral-500 sm:text-xs">
                  <span className="block break-words text-left">{project.category}</span>
                </span>
              </div>
              <h1 className="mb-6 max-w-[14ch] text-balance text-5xl font-semibold tracking-tight text-black sm:text-6xl">
                {project.title}
              </h1>
              <p className="max-w-[68ch] text-lg text-pretty text-neutral-600 sm:text-base">{project.description}</p>

              {metaItems.length > 0 && (
                <dl className="mt-8 grid gap-4 border-y border-neutral-950/10 py-5 sm:grid-cols-2 xl:grid-cols-3">
                  {metaItems.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex gap-3">
                      <Icon className="mt-0.5 size-5 text-neutral-400 sm:size-4" aria-hidden="true" />
                      <div>
                        <dt className="text-base font-semibold text-black sm:text-sm">{label}</dt>
                        <dd className="text-base text-neutral-600 sm:text-sm">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </header>

            {heroImage && (
              <figure className="mb-12">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 outline outline-1 -outline-offset-1 outline-black/5">
                  <Image
                    src={
                      heroImage.detailSrc ||
                      projectMediaVariantUrl(heroImage.src, "detail") ||
                      heroImage.src ||
                      "/placeholder.svg"
                    }
                    alt={heroImage.alt || project.title}
                    fill
                    sizes="(min-width: 1280px) 55vw, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>
                {heroImage.caption && (
                  <figcaption className="mt-3 max-w-[72ch] text-base text-neutral-500 sm:text-sm">
                    {heroImage.caption}
                  </figcaption>
                )}
              </figure>
            )}

            {hasRichTextContent(project.content) ? (
              <ProjectRichTextRenderer content={project.content} />
            ) : project.details ? (
              <div className="space-y-10">
                {project.details.introduction && (
                  <TextSection title="Introduction">
                    <p className="max-w-[72ch] text-base text-pretty text-neutral-700 sm:text-sm">
                      {project.details.introduction}
                    </p>
                  </TextSection>
                )}

                {project.details.objective && (
                  <TextSection title="Objective">
                    <p className="max-w-[72ch] text-base text-pretty text-neutral-700 sm:text-sm">
                      {project.details.objective}
                    </p>
                  </TextSection>
                )}

                {project.details.approach && (
                  <TextSection title="Approach">
                    <DetailList items={project.details.approach} />
                  </TextSection>
                )}

                {project.details.implementation && (
                  <TextSection title="Implementation">
                    <DetailList items={project.details.implementation} />
                  </TextSection>
                )}

                {project.details.outcomes && (
                  <TextSection title="Outcomes">
                    <DetailList items={project.details.outcomes} />
                  </TextSection>
                )}

                {project.details.takeaway && (
                  <TextSection title="Key Takeaway">
                    <p className="max-w-[72ch] text-base font-medium text-pretty text-neutral-800 sm:text-sm">
                      {project.details.takeaway}
                    </p>
                  </TextSection>
                )}
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-10">
            {secondaryImages.length > 0 && (
              <section className="rounded-lg border border-neutral-950/10 p-4">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold tracking-tight text-black">Project gallery</h2>
                  <p className="mt-1 text-base text-neutral-500 sm:text-sm">
                    Captions stay attached to each image wherever it appears.
                  </p>
                </div>
                <ProjectGallery images={secondaryImages} />
              </section>
            )}

            <section className="rounded-lg bg-neutral-50 p-5">
              <h2 className="mb-3 text-xl font-semibold tracking-tight text-black">Start a conversation</h2>
              <p className="mb-5 text-base text-pretty text-neutral-600 sm:text-sm">
                Discuss strategy, communications, event direction, or a campaign that needs a sharper public story.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-base font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:py-2 sm:text-sm"
                >
                  <Mail className="size-5 sm:size-4" aria-hidden="true" />
                  Email
                </a>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-base font-semibold text-neutral-950 ring-1 ring-black/10 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:py-2 sm:text-sm"
                >
                  View all projects
                  <ArrowRight className="size-5 sm:size-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </article>
  )
}
