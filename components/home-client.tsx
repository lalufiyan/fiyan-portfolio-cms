"use client"

import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import type { PointerEvent } from "react"

import type { LandingProject, ProjectImage } from "@/lib/projects-cms"

const easeOut = "power3.out"
const easeInOut = "power3.inOut"

interface HomeClientProps {
  landingProjects: LandingProject[]
}

interface LightboxImage {
  alt: string
  animated?: boolean
  caption?: string
  src: string
}

const slideThemes = [
  {
    key: "dark",
    section: "bg-black text-white",
    meta: "text-neutral-400",
    description: "text-neutral-300",
    image: "bg-neutral-900 outline-white/10",
  },
  {
    key: "soft",
    section: "bg-[#f6f7f9] text-neutral-950",
    meta: "text-neutral-500",
    description: "text-neutral-600",
    image: "bg-neutral-200 outline-black/5 shadow-sm",
  },
  {
    key: "light",
    section: "border-t border-neutral-200 bg-white text-neutral-950",
    meta: "text-neutral-500",
    description: "text-neutral-600",
    image: "bg-neutral-100 outline-black/5 shadow-sm",
  },
]

const projectMeta = (project: LandingProject) => {
  const parts = [project.year, project.role].filter(Boolean)
  return parts.join(" - ")
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)"
const revealTargetSelector = "[data-slide-copy], [data-slide-card]"

function useReducedMotionPreference() {
  return useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia(reducedMotionQuery)

      media.addEventListener("change", callback)

      return () => media.removeEventListener("change", callback)
    },
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  )
}

// A reveal is decorative: slides and their children are never hidden before observation.
const animateSlide = (slide: HTMLElement) => {
  const targets = Array.from(slide.querySelectorAll<HTMLElement>(revealTargetSelector))
  if (targets.length === 0) return

  try {
    gsap.fromTo(
      targets,
      { y: 18 },
      {
        y: 0,
        duration: 0.45,
        stagger: 0.035,
        ease: easeOut,
        overwrite: true,
        onComplete: () => gsap.set(targets, { clearProps: "transform" }),
      },
    )
  } catch {
    // Animation failure must never affect content visibility.
    targets.forEach((target) => target.style.removeProperty("transform"))
  }
}

function GalleryImage({
  image,
  onOpen,
  prefersReducedMotion,
  themeClass,
}: {
  image: ProjectImage
  onOpen: (image: ProjectImage) => void
  prefersReducedMotion: boolean
  themeClass: string
}) {
  const cardRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const animateCard = (isActive: boolean) => {
    if (prefersReducedMotion) {
      return
    }

    gsap.to(cardRef.current, {
      y: isActive ? -6 : 0,
      duration: 0.2,
      ease: "power2.out",
      overwrite: true,
    })
    gsap.to(imageRef.current, {
      scale: isActive ? 1.035 : 1,
      duration: 0.3,
      ease: easeOut,
      overwrite: true,
    })
  }

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      animateCard(true)
    }
  }

  return (
    <figure
      ref={cardRef}
      data-slide-card
      className={`group relative aspect-[4/3] overflow-hidden rounded-2xl outline outline-1 -outline-offset-1 will-change-transform ${themeClass}`}
    >
      <button
        type="button"
        className="relative block size-full text-left outline-none transition-transform duration-150 ease-out active:scale-[0.995] focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
        onClick={() => onOpen(image)}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={() => animateCard(false)}
        aria-label={`Open ${image.alt}`}
      >
        <Image
          src={image.thumbnailSrc || image.src || "/placeholder.svg"}
          alt={image.alt}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover will-change-transform"
          ref={imageRef}
        />
        {image.caption && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-base text-white sm:text-sm">
            {image.caption}
          </span>
        )}
      </button>
    </figure>
  )
}

function Lightbox({
  image,
  onClose,
  prefersReducedMotion,
}: {
  image: LightboxImage | null
  onClose: () => void
  prefersReducedMotion: boolean
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const closeLightbox = useCallback(() => {
    if (prefersReducedMotion) {
      onClose()
      return
    }

    const overlay = overlayRef.current
    const content = contentRef.current

    if (!overlay || !content) {
      onClose()
      return
    }

    gsap.killTweensOf([overlay, content])
    gsap.to(content, {
      autoAlpha: 0,
      scale: 0.985,
      y: 10,
      duration: 0.18,
      ease: easeInOut,
      overwrite: true,
    })
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.18,
      ease: easeInOut,
      overwrite: true,
      onComplete: onClose,
    })
  }, [onClose, prefersReducedMotion])

  useEffect(() => {
    if (!image) {
      return
    }

    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox()
      } else if (event.key === "Tab") {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    if (prefersReducedMotion) {
      return () => {
        document.body.style.overflow = previousOverflow
        document.removeEventListener("keydown", onKeyDown)
      }
    }

    gsap.fromTo(
      overlayRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.28, ease: easeOut, overwrite: true },
    )
    gsap.fromTo(
      contentRef.current,
      { autoAlpha: 0, scale: 0.965, y: 14 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.28, ease: easeOut, overwrite: true },
    )

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [closeLightbox, image, prefersReducedMotion])

  if (!image) {
    return null
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-5 backdrop-blur-md sm:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={closeLightbox}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="absolute right-6 top-6 z-[101] flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl leading-none text-white backdrop-blur transition-colors duration-150 ease-out hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        onClick={(event) => {
          event.stopPropagation()
          closeLightbox()
        }}
        aria-label="Close image preview"
      >
        x
      </button>
      <figure ref={contentRef} className="relative max-h-[88vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative mx-auto aspect-[4/3] max-h-[78vh] overflow-hidden rounded-xl">
          <Image src={image.src} alt={image.alt} fill sizes="92vw" className="object-contain" unoptimized={image.animated} />
        </div>
        {image.caption && <figcaption className="mx-auto mt-4 max-w-3xl text-center text-base text-white/80">{image.caption}</figcaption>}
      </figure>
    </div>
  )
}

export function HomeClient({ landingProjects }: HomeClientProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const revealedSlidesRef = useRef<Set<HTMLElement>>(new Set())
  const lightboxTriggerRef = useRef<HTMLElement | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)
  const activeTheme = slideThemes[activeSlide % slideThemes.length]
  const isDarkIndicator = activeTheme?.key === "dark"
  const prefersReducedMotion = useReducedMotionPreference()
  useEffect(() => {
    const slides = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-landing-slide]") ?? [])
    const siteMain = rootRef.current?.closest<HTMLElement>("[data-site-main]")
    const desktop = window.matchMedia("(min-width: 1024px)")
    if (!slides.length || !("IntersectionObserver" in window)) return

    let observer: IntersectionObserver | undefined
    const observeSlides = () => {
      observer?.disconnect()
      const ratios = new Map<HTMLElement, number>()
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const slide = entry.target as HTMLElement
            ratios.set(slide, entry.isIntersecting ? entry.intersectionRatio : 0)
            if (entry.isIntersecting && !prefersReducedMotion && !revealedSlidesRef.current.has(slide)) {
              revealedSlidesRef.current.add(slide)
              animateSlide(slide)
            }
          }

          let closest = -1
          let largestRatio = 0
          slides.forEach((slide, index) => {
            const ratio = ratios.get(slide) ?? 0
            if (ratio > largestRatio) {
              largestRatio = ratio
              closest = index
            }
          })
          if (closest !== -1) setActiveSlide((previous) => previous === closest ? previous : closest)
        },
        { root: desktop.matches ? siteMain ?? null : null, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
      )
      slides.forEach((slide) => observer?.observe(slide))
    }

    observeSlides()
    desktop.addEventListener("change", observeSlides)
    return () => {
      desktop.removeEventListener("change", observeSlides)
      observer?.disconnect()
      slides.forEach((slide) => {
        const targets = Array.from(slide.querySelectorAll<HTMLElement>(revealTargetSelector))
        gsap.killTweensOf(targets)
        targets.forEach((target) => target.style.removeProperty("transform"))
      })
    }
  }, [landingProjects, prefersReducedMotion])

  const closeLightbox = useCallback(() => {
    setLightboxImage(null)
    lightboxTriggerRef.current?.focus()
  }, [])
  const openLightbox = (image: ProjectImage) => {
    lightboxTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setLightboxImage({
      src: image.lightboxSrc || image.detailSrc || image.src,
      alt: image.alt,
      animated: image.type === "video",
      caption: image.caption,
    })
  }

  const scrollToSlide = (index: number) => {
    const target = rootRef.current?.querySelector<HTMLElement>(`[data-landing-slide="${index}"]`)
    target?.scrollIntoView({
      behavior: prefersReducedMotion ? "instant" : "smooth",
      block: "start",
    })
  }

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-hidden bg-white text-neutral-950 antialiased">
      <div className="min-w-0 flex-1 overflow-x-hidden">
        {landingProjects.map((project, index) => {
          const theme = slideThemes[index % slideThemes.length]
          const slideImages = project.images.slice(0, 4)
          const isDarkSlide = theme.key === "dark"

          return (
            <section
              key={project.slug}
              data-landing-slide={index}
              className={`flex min-h-[90vh] flex-col justify-center px-5 py-14 sm:px-6 lg:px-20 lg:py-20 ${theme.section}`}
            >
              <div className="mb-10 max-w-3xl lg:mb-14">
                <Link href={`/projects/${project.slug}`} className="group inline-block" data-slide-copy>
                  <h2 className="mb-4 max-w-[14ch] text-4xl font-semibold tracking-tight text-balance transition-opacity duration-150 ease-out group-hover:opacity-80 motion-reduce:transition-none sm:text-5xl">
                    {project.title}
                  </h2>
                </Link>
                <p data-slide-copy className={`mb-5 text-base font-medium sm:text-sm ${theme.meta}`}>
                  {projectMeta(project)}
                </p>
                <p data-slide-copy className={`max-w-[60ch] text-lg text-pretty sm:text-base ${theme.description}`}>
                  {project.description}
                </p>
                <div data-slide-copy className="mt-7">
                  <Link
                    href={`/projects/${project.slug}`}
                    className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-base font-semibold transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:py-2 sm:text-sm ${
                      isDarkSlide
                        ? "bg-white text-black hover:bg-neutral-200 focus-visible:outline-white"
                        : "bg-black text-white hover:bg-neutral-800 focus-visible:outline-black"
                    }`}
                    aria-label={`View project ${project.title}`}
                  >
                    View Project
                  </Link>
                </div>
              </div>

              {slideImages.length > 0 && (
                <div className="grid w-full max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {slideImages.map((image) => (
                    <GalleryImage
                      key={image.id}
                      image={image}
                      onOpen={openLightbox}
                      prefersReducedMotion={prefersReducedMotion}
                      themeClass={theme.image}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {landingProjects.length > 0 && (
        <nav className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-1 md:flex" aria-label="Project slide navigation">
          {landingProjects.map((project, index) => {
            const isActive = index === activeSlide

            return (
              <button
                key={project.slug}
                type="button"
                onClick={() => scrollToSlide(index)}
                className="group flex size-11 items-center justify-end rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                aria-label={project.title}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className={`block h-1 w-8 origin-right rounded-full transition-[background-color,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
                    isActive ? "scale-x-100 opacity-100" : "scale-x-[0.55] opacity-60 group-hover:scale-x-75"
                  } ${isDarkIndicator ? "bg-white" : "bg-black"}`}
                />
              </button>
            )
          })}
        </nav>
      )}

      <Lightbox
        image={lightboxImage}
        onClose={closeLightbox}
        prefersReducedMotion={prefersReducedMotion}
      />
    </div>
  )
}
