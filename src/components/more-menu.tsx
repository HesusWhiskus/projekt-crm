"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MoreHorizontal, Sparkles, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FEATURE_KEYS } from "@/lib/feature-flags"

interface MoreMenuProps {
  enabledFeatures: string[]
}

export function MoreMenu({ enabledFeatures }: MoreMenuProps) {
  const pathname = usePathname()

  const moreItems = [
    {
      name: "Funkcje PRO",
      href: "/pro-features",
      icon: Sparkles,
      alwaysVisible: true,
    },
    {
      name: "Integracje",
      href: "/integrations",
      icon: Settings,
      featureKey: FEATURE_KEYS.EXTERNAL_INTEGRATIONS,
    },
  ]

  const visibleItems = moreItems.filter(
    (item) => item.alwaysVisible || (item.featureKey && enabledFeatures.includes(item.featureKey))
  )

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2 px-3 py-2">
          <MoreHorizontal className="h-4 w-4" />
          <span className="hidden lg:inline">Więcej</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <DropdownMenuItem key={item.name} asChild>
              <Link
                href={item.href}
                className={`flex items-center space-x-2 w-full ${
                  isActive ? "bg-accent" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

