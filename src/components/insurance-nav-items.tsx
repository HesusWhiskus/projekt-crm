"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, FileText, Car, ChevronDown } from "lucide-react"
import { FEATURE_KEYS } from "@/lib/feature-flags"
import { useIsMobile } from "@/hooks/use-media-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InsuranceNavItemsProps {
  enabledFeatures: string[]
  isInsuranceAgent?: boolean
  onItemClick?: () => void
}

export function InsuranceNavItems({ enabledFeatures, isInsuranceAgent = false, onItemClick }: InsuranceNavItemsProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Check if insurance agents feature is enabled and user is an insurance agent
  if (!enabledFeatures.includes(FEATURE_KEYS.INSURANCE_AGENTS) || !isInsuranceAgent) {
    return null
  }

  const insuranceNavItems: Array<{
    name: string
    href: string
    icon: any
  }> = [
    {
      name: "Kalkulacje",
      href: "/insurance-agent/calculations",
      icon: FileText,
    },
    {
      name: "Polisy",
      href: "/insurance-agent/policies",
      icon: Shield,
    },
    {
      name: "Pojazdy",
      href: "/insurance-agent/vehicles",
      icon: Car,
    },
  ]

  // Check if any insurance agent page is active
  const isInsuranceAgentActive = pathname.startsWith("/insurance-agent/")

  // Mobile: render as collapsible section
  if (isMobile) {
    return (
      <div className="pt-2 border-t border-border">
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Agenci ubezpieczeniowi</div>
          <div className="space-y-1">
            {insuranceNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors min-h-[44px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Desktop: render as list items (for sidebar)
  return (
    <>
      {insuranceNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            onClick={onItemClick}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0 mr-3" aria-hidden="true" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </>
  )
}

