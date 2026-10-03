import { RichText, type JSXConvertersFunction } from "@payloadcms/richtext-lexical/react"
import Image from "next/image"
import Link from "next/link"

import type { ProjectRichText } from "@/lib/project-rich-text"
import { mediaSizeUrl, mediaUrl } from "@/lib/media-url"
import { cn } from "@/lib/utils"

type MediaValue = {
  alt?: string
  caption?: string
  filename?: string
  prefix?: string
  sizes?: Record<string, { filename?: string; url?: string }>
  thumbnailURL?: string
  url?: string
}

type BlockFields = {
  blockType?: string
  body?: string
  caption?: string
  heading?: string
  href?: string
  image?: MediaValue | number | string
  items?: Array<{
    description?: string
    label?: string
    value?: string
  }>
  label?: string
  layout?: "full" | "inset" | "wide"
  quote?: string
  text?: string
  tone?: "neutral" | "strong"
  attribution?: string
  eyebrow?: string
}

type BlockNode = {
  fields?: BlockFields
}

type BlockConverterArgs = {
  node: unknown
}

const getBlockFields = (node: unknown): BlockFields => {
  if (!node || typeof node !== "object" || !("fields" in node)) {
    return {}
  }

  return ((node as BlockNode).fields || {}) as BlockFields
}

const projectRichTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    imageFeature: ({ node }: BlockConverterArgs) => {
      const fields = getBlockFields(node)
      const src = mediaSizeUrl(fields.image, "detail") || mediaUrl(fields.image)

      if (!src) {
        return null
      }

      const image = typeof fields.image === "object" && fields.image ? fields.image : undefined
      const caption = fields.caption || image?.caption
      const layout = fields.layout || "wide"

      return (
        <figure
          className={cn(
            "my-8",
            layout === "inset" && "max-w-[48rem]",
            layout === "wide" && "relative left-1/2 w-[min(calc(100vw-2rem),56rem)] -translate-x-1/2",
            layout === "full" && "relative left-1/2 w-[min(calc(100vw-2rem),72rem)] -translate-x-1/2",
          )}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 outline outline-1 -outline-offset-1 outline-black/5">
            <Image
              src={src}
              alt={image?.alt || caption || "Project image"}
              fill
              sizes="(min-width: 1280px) 56rem, 100vw"
              className="object-cover"
            />
          </div>
          {caption && <figcaption className="mt-3 text-sm text-neutral-500">{caption}</figcaption>}
        </figure>
      )
    },
    metrics: ({ node }: BlockConverterArgs) => {
      const fields = getBlockFields(node)
      const items = Array.isArray(fields.items) ? fields.items.filter((item) => item.value && item.label) : []

      if (items.length === 0) {
        return null
      }

      return (
        <section className="my-8 rounded-lg border border-neutral-950/10 bg-neutral-50 p-5">
          {fields.eyebrow && (
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {fields.eyebrow}
            </p>
          )}
          <dl className="grid gap-4 sm:grid-cols-3">
            {items.map((item, index) => (
              <div key={`${item.value}-${index}`}>
                <dt className="text-3xl font-semibold tracking-tight text-black">{item.value}</dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-800">{item.label}</dd>
                {item.description && <p className="mt-2 text-sm text-neutral-600">{item.description}</p>}
              </div>
            ))}
          </dl>
        </section>
      )
    },
    pullQuote: ({ node }: BlockConverterArgs) => {
      const fields = getBlockFields(node)

      if (!fields.quote) {
        return null
      }

      return (
        <blockquote className="my-8 border-l-2 border-black pl-5">
          <p className="text-xl font-semibold leading-snug tracking-tight text-black">{fields.quote}</p>
          {fields.attribution && <footer className="mt-3 text-sm text-neutral-500">{fields.attribution}</footer>}
        </blockquote>
      )
    },
    callout: ({ node }: BlockConverterArgs) => {
      const fields = getBlockFields(node)

      if (!fields.heading && !fields.body) {
        return null
      }

      return (
        <aside
          className={cn(
            "my-8 rounded-lg border p-5",
            fields.tone === "strong"
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-950/10 bg-neutral-50 text-neutral-950",
          )}
        >
          {fields.heading && <h3 className="text-lg font-semibold tracking-tight">{fields.heading}</h3>}
          {fields.body && (
            <p className={cn("mt-2 text-sm", fields.tone === "strong" ? "text-neutral-200" : "text-neutral-600")}>
              {fields.body}
            </p>
          )}
        </aside>
      )
    },
    cta: ({ node }: BlockConverterArgs) => {
      const fields = getBlockFields(node)

      if (!fields.href || !fields.label) {
        return null
      }

      return (
        <aside className="my-8 rounded-lg bg-neutral-950 p-5 text-white">
          {fields.heading && <h3 className="text-xl font-semibold tracking-tight">{fields.heading}</h3>}
          {fields.text && <p className="mt-2 text-sm text-neutral-300">{fields.text}</p>}
          <Link
            href={fields.href}
            className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {fields.label}
          </Link>
        </aside>
      )
    },
  },
})

interface ProjectRichTextRendererProps {
  content: ProjectRichText
}

export function ProjectRichTextRenderer({ content }: ProjectRichTextRendererProps) {
  return (
    <RichText
      data={content as never}
      converters={projectRichTextConverters}
      className="max-w-[72ch] text-base text-neutral-700 sm:text-sm [&_a]:font-semibold [&_a]:text-black [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-black [&_blockquote]:pl-5 [&_blockquote]:font-medium [&_h2]:mt-10 [&_h2]:border-t [&_h2]:border-neutral-950/10 [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-black [&_h2:first-child]:mt-0 [&_li]:pl-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-5 [&_p]:my-4 [&_p]:text-pretty [&_strong]:font-semibold [&_strong]:text-neutral-950 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-5"
    />
  )
}
