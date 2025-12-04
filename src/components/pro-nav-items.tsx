"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3 } from "lucide-react"
import { FEATURE_KEYS } from "@/lib/feature-flags"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "@/components/layout/sidebar-context"

interface ProNavItemsProps {
  enabledFeatures: string[]
  onItemClick?: () => void
  collapsed?: boolean
}

export function ProNavItems({ enabledFeatures, onItemClick, collapsed: propCollapsed }: ProNavItemsProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { collapsed: contextCollapsed } = useSidebar()
  const collapsed = propCollapsed !== undefined ? propCollapsed : contextCollapsed

  const proNavItems: Array<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: string }>
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
    : collapsed
    ? "flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
    : "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"

  const content = (
    <>
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const linkContent = (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            onClick={onItemClick}
            className={cn(
              baseClasses,
              isActive
                ? "sidebar-active-ibooster"
                : "text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.name : undefined}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                !isMobile && !collapsed && "mr-3",
                isActive ? "text-white" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            {!isMobile && !collapsed && <span>{item.name}</span>}
          </Link>
        )

        if (collapsed && !isMobile) {
          return (
            <TooltipProvider key={item.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }

        return linkContent
      })}
    </>
  )

  return content
}
