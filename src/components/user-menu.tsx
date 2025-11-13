"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { User, Settings, Shield, MoreHorizontal, LogOut, Sparkles, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FEATURE_KEYS } from "@/lib/feature-flags"
import { UserRole } from "@prisma/client"

interface UserMenuProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
  enabledFeatures: string[]
  isPro: boolean
}

export function UserMenu({ user, enabledFeatures, isPro }: UserMenuProps) {
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
      icon: SettingsIcon,
      featureKey: FEATURE_KEYS.EXTERNAL_INTEGRATIONS,
    },
  ]

  const visibleMoreItems = moreItems.filter(
    (item) => item.alwaysVisible || (item.featureKey && enabledFeatures.includes(item.featureKey))
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden md:inline">{user.name || user.email}</span>
          {isPro && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              PRO
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name || user.email}</p>
            {user.role === "ADMIN" && (
              <p className="text-xs text-muted-foreground">Administrator</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Ustawienia
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Panel administracyjny
            </Link>
          </DropdownMenuItem>
        )}
        {visibleMoreItems.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Więcej</DropdownMenuLabel>
            {visibleMoreItems.map((item) => {
              const Icon = item.icon
              return (
                <DropdownMenuItem key={item.name} asChild>
                  <Link href={item.href} className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Wyloguj się
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

