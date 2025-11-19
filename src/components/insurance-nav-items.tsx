"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, FileText, Car, LayoutDashboard, Settings } from "lucide-react"
import { FEATURE_KEYS } from "@/lib/feature-flags"
import { useIsMobile } from "@/hooks/use-media-query"

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
      name: "Dashboard agenta",
      href: "/insurance-agent/dashboard",
      icon: LayoutDashboard,
    },
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

  const baseClasses = isMobile
    ? "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors min-h-[44px]"
    : "flex items-center space-x-2 px-2 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"

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
            className={`${baseClasses} ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </>
  )
}

