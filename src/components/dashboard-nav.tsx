"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { UserRole } from "@prisma/client"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  LogOut,
  Settings,
  Menu,
  X,
  Crown,
  Sparkles,
} from "lucide-react"
import { WhatsNewButton } from "@/components/whats-new-button"
import { useIsMobile } from "@/hooks/use-media-query"
import { ProNavItems } from "@/components/pro-nav-items"
import { UserMenu } from "@/components/user-menu"
import { FEATURE_KEYS } from "@/lib/feature-flags"

interface DashboardNavProps {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    position?: string | null
  }
  systemName: string
  systemLogo: string | null
  userColorScheme: {
    primaryColor?: string | null
    themeName?: string | null
    theme?: string | null
  } | null
  defaultColorScheme: {
    primaryColor?: string
    themeName?: string
  } | null
  enabledFeatures?: string[]
  isPro?: boolean
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Klienci", href: "/clients", icon: Users },
  { name: "Kontakty", href: "/contacts", icon: FileText },
  { name: "Zadania", href: "/tasks", icon: CheckSquare },
  { name: "Kalendarz", href: "/calendar", icon: Calendar },
]

export function DashboardNav({
  user,
  systemName,
  systemLogo,
  userColorScheme,
  defaultColorScheme,
  enabledFeatures = [],
  isPro = false,
}: DashboardNavProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { setTheme, theme } = useTheme()

  // Apply theme from user preferences
  useEffect(() => {
    if (userColorScheme?.theme) {
      setTheme(userColorScheme.theme)
    } else if (!theme) {
      setTheme("light")
    }
  }, [userColorScheme?.theme, setTheme, theme])

  // Apply color scheme (only on client)
  useEffect(() => {
    if (typeof window === "undefined") return

    const themeName = userColorScheme?.themeName || defaultColorScheme?.themeName || "blue"
    const primaryColor =
      themeName === "system"
        ? defaultColorScheme?.primaryColor || "#3b82f6"
        : themeName === "custom"
        ? userColorScheme?.primaryColor || "#3b82f6"
        : null

    if (primaryColor) {
      document.documentElement.style.setProperty("--color-primary", primaryColor)
    }
    document.documentElement.setAttribute("data-theme", themeName)
  }, [userColorScheme, defaultColorScheme])

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-[98%] mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center space-x-4 md:space-x-6 flex-shrink-0">
            <Link
              href="/dashboard"
              className="flex flex-col items-center space-y-1"
              style={{ color: "var(--color-primary, #3b82f6)" }}
            >
              {systemLogo && systemLogo.trim() !== "" ? (
                <div className="relative w-56 h-16 flex items-center justify-start overflow-hidden">
                  {systemLogo.startsWith("http") ? (
                    <Image
                      src={systemLogo}
                      alt="Logo"
                      width={224}
                      height={64}
                      className="w-full h-full object-contain object-left logo-theme-adapt"
                      unoptimized
                    />
                  ) : (
                    <img
                      src={systemLogo}
                      alt="Logo"
                      className="w-full h-full object-contain object-left logo-theme-adapt"
                    />
                  )}
                </div>
              ) : (
                <span className="text-xl font-bold">{systemName}</span>
              )}
            </Link>
            <div className="hidden md:flex items-center space-x-1 flex-1 overflow-x-auto">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center space-x-2 px-2 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <ProNavItems enabledFeatures={enabledFeatures} />
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            {!isMobile && <WhatsNewButton />}
            <UserMenu user={user} enabledFeatures={enabledFeatures} isPro={isPro} />
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="min-w-[44px] min-h-[44px]"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
        {/* Mobile menu */}
        {isMobile && mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors min-h-[44px] ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              {/* Pro features in mobile menu */}
              <div className="pt-2 border-t border-border space-y-1">
                <ProNavItems
                  enabledFeatures={enabledFeatures}
                  onItemClick={() => setMobileMenuOpen(false)}
                />
                {/* More menu items in mobile */}
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Więcej</div>
                  <div className="space-y-1">
                    <Link
                      href="/pro-features"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted min-h-[44px]"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span>Funkcje PRO</span>
                    </Link>
                    {enabledFeatures.includes(FEATURE_KEYS.EXTERNAL_INTEGRATIONS) && (
                      <Link
                        href="/integrations"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted min-h-[44px]"
                      >
                        <Settings className="h-5 w-5" />
                        <span>Integracje</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted min-h-[44px]"
                >
                  <Settings className="h-5 w-5" />
                  <span>Ustawienia</span>
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted min-h-[44px]"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{user.name || user.email}</div>
                  {user.position && (
                    <div className="text-xs">{user.position}</div>
                  )}
                  {!user.position && user.role === "ADMIN" && (
                    <div className="text-xs">Administrator</div>
                  )}
                </div>
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Wyloguj się
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

