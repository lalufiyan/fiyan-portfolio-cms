import type { ReactNode } from "react"

import { PortfolioSidebar } from "@/components/portfolio-sidebar"
import type { SiteSettingsView } from "@/lib/site-settings"

interface SiteShellProps {
  children: ReactNode
  settings?: SiteSettingsView
}

export function SiteShell({ children, settings }: SiteShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-950 antialiased lg:flex lg:h-dvh lg:overflow-hidden">
      <PortfolioSidebar profile={settings} />
      <main data-site-main className="min-w-0 flex-1 overflow-x-hidden lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
