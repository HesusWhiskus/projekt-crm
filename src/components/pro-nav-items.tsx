"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Key, Webhook, Settings, Sparkles } from "lucide-react"
import { FEATURE_KEYS } from "@/lib/feature-flags"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

interface ProNavItemsProps {
  enabledFeatures: string[]
  onItemClick?: () => void
}

export function ProNavItems({ enabledFeatures, onItemClick }: ProNavItemsProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  const proNavItems: Array<{
    name: string
    href: string
    icon: any
    featureKey?: string
    alwaysVisible?: boolean
  }> = [
    {
      name: "Raporty",
      href: "/reports",
      icon: BarChart3,
      featureKey: FEATURE_KEYS.ADVANCED_REPORTS,
    },
    // "Funkcje PRO" and "Integracje" are now in MoreMenu
  ]

  const visibleItems = proNavItems.filter(
    (item) => item.alwaysVisible || (item.featureKey && enabledFeatures.includes(item.featureKey))
  )

  if (visibleItems.length === 0) {
    return null
  }

  const baseClasses = isMobile
    ? "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors min-h-[44px]"
    : "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"

  return (
    <>
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            onClick={onItemClick}
            className={`${baseClasses} ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0", !isMobile && "mr-3")} aria-hidden="true" />
            {!isMobile && <span>{item.name}</span>}
          </Link>
        )
      })}
    </>
  )
}
