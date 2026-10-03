"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { ProjectImage } from "@/lib/projects-cms"
import { projectMediaVariantUrl } from "@/lib/media-url"

interface ProjectGalleryProps {
  className?: string
  images: ProjectImage[]
}

export function ProjectGallery({ className, images }: ProjectGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const isOpen = selectedIndex !== null
  const currentImage = selectedIndex !== null ? images[selectedIndex] : null

  useEffect(() => {
    if (!isOpen) {
      return
    }

    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null)
      }

      if (event.key === "Tab") {
        const controls = overlayRef.current?.querySelectorAll<HTMLButtonElement>("button")
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setSelectedIndex((index) => (index === null || index === 0 ? images.length - 1 : index - 1))
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        setSelectedIndex((index) => (index === null || index === images.length - 1 ? 0 : index + 1))
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [images.length, isOpen])

  const goToPrevious = () => {
    setSelectedIndex((index) => (index === null || index === 0 ? images.length - 1 : index - 1))
  }

  const goToNext = () => {
    setSelectedIndex((index) => (index === null || index === images.length - 1 ? 0 : index + 1))
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {images.map((image, index) => (
          <figure
            key={image.id}
            className="min-w-0"
          >
            <button
              type="button"
              onClick={(event) => {
                triggerRef.current = event.currentTarget
                setSelectedIndex(index)
              }}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-neutral-100 outline outline-1 -outline-offset-1 outline-black/5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              aria-label={`Open ${image.caption || image.alt}`}
            >
              <Image
                src={image.thumbnailSrc || projectMediaVariantUrl(image.src, "thumb") || image.src || "/placeholder.svg"}
                alt=""
                fill
                sizes="(min-width: 1280px) 12vw, (min-width: 768px) 22vw, 45vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" aria-hidden="true" />
              {image.type === "video" && (
                <span className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white" aria-hidden="true">
                  <Play className="size-4 fill-white" />
                </span>
              )}
            </button>
            {(image.caption || image.alt) && (
              <figcaption className="mt-2 line-clamp-2 text-base text-pretty text-neutral-500 sm:text-sm">
                {image.caption || image.alt}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <AnimatePresence onExitComplete={() => triggerRef.current?.focus()}>
        {isOpen && currentImage && (
          <motion.div
            ref={overlayRef}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-5 backdrop-blur-md sm:p-10"
            onClick={() => setSelectedIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label={currentImage.caption || currentImage.alt}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute right-5 top-5 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Close image preview"
            >
              <X className="size-6" aria-hidden="true" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    goToPrevious()
                  }}
                  className="absolute left-5 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    goToNext()
                  }}
                  className="absolute right-5 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
              </>
            )}

            <motion.figure
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.965, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.965, y: 14 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: "easeOut" }}
              className="relative flex max-h-[88vh] w-full max-w-6xl flex-col items-center"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative h-[78vh] w-full overflow-hidden rounded-xl">
                <Image
                  src={
                    currentImage.type === "video"
                      ? currentImage.lightboxSrc || currentImage.src || "/placeholder.svg"
                      : currentImage.lightboxSrc ||
                        projectMediaVariantUrl(currentImage.src, "lightbox") ||
                        currentImage.detailSrc ||
                        currentImage.src ||
                        "/placeholder.svg"
                  }
                  alt={currentImage.alt}
                  fill
                  sizes="(min-width: 1280px) 72rem, 100vw"
                  className="object-contain"
                  unoptimized={currentImage.type === "video"}
                />
              </div>
              {(currentImage.caption || currentImage.description) && (
                <figcaption className="mt-4 max-w-3xl text-center text-base text-pretty text-white/80 sm:text-sm">
                  {currentImage.caption || currentImage.description}
                </figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
