import Image from "next/image"
import Link from "next/link"

import { fallbackSiteSettings, type SiteSettingsView } from "@/lib/site-settings"
import { cn } from "@/lib/utils"

interface PortfolioSidebarProps {
  className?: string
  profile?: SiteSettingsView
  reveal?: boolean
}

export function PortfolioSidebar({
  className,
  profile = fallbackSiteSettings,
  reveal = false,
}: PortfolioSidebarProps) {
  const revealValue = reveal ? "" : undefined
  const brandMark = profile.brandMark

  return (
    <aside
      data-portfolio-sidebar
      className={cn(
        "w-full max-w-full border-b border-neutral-200 bg-white px-6 py-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-80 lg:flex-shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:px-8 lg:py-10",
        className,
      )}
    >
      <div className="flex-1">
        {brandMark ? (
          <Image
            data-sidebar-reveal={revealValue}
            src={brandMark.src}
            alt={brandMark.alt}
            width={36}
            height={36}
            className="mb-8 size-9 rounded-full object-cover shadow-[0_4px_12px_rgba(139,92,246,0.2)]"
          />
        ) : (
          <div
            data-sidebar-reveal={revealValue}
            className="mb-8 size-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 shadow-[0_4px_12px_rgba(139,92,246,0.2)]"
            aria-hidden="true"
          />
        )}
        <p data-sidebar-reveal={revealValue} className="mb-1 text-base font-medium text-neutral-500 sm:text-sm">
          {profile.eyebrow}
        </p>
        <h1
          data-sidebar-reveal={revealValue}
          className="mb-4 max-w-[12ch] text-balance text-3xl font-semibold tracking-tight text-black"
        >
          {profile.ownerName}
        </h1>
        <p data-sidebar-reveal={revealValue} className="mb-6 max-w-[34ch] text-base text-pretty text-neutral-600 sm:text-sm">
          {profile.description}
        </p>

        <div data-sidebar-reveal={revealValue} className="mb-8 flex flex-col gap-2 sm:flex-row lg:flex-row">
          <Link
            href="/projects"
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2.5 text-base font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:w-auto sm:py-2 sm:text-sm"
          >
            View projects
          </Link>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-neutral-100 px-4 py-2.5 text-base font-semibold text-neutral-950 transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:w-auto sm:py-2 sm:text-sm"
          >
            Email
          </a>
        </div>

        <div data-sidebar-reveal={revealValue} className="my-7 h-px bg-neutral-200" />

        <div data-sidebar-reveal={revealValue}>
          <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wide text-neutral-400 sm:text-xs">
            Services
          </h2>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 min-[460px]:grid-cols-2">
            {profile.services.map((service) => (
              <p key={service} className="text-base font-medium text-neutral-700 sm:text-sm">
                {service}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div data-sidebar-reveal={revealValue} className="mt-8 border-t border-neutral-100 pt-6 lg:mt-auto">
        <p className="mb-2 text-base text-neutral-500 sm:text-sm">
          {profile.socials.map((social, index) => (
            <span key={social.href}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-black hover:underline"
              >
                {social.label}
              </a>
              {index < profile.socials.length - 1 && " / "}
            </span>
          ))}
        </p>
        <p className="text-sm text-neutral-400 sm:text-xs">{profile.location}</p>
      </div>
    </aside>
  )
}
