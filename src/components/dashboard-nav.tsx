"use client"

import { useEffect } from "react"
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
} from "lucide-react"
import { WhatsNewButton } from "@/components/whats-new-button"

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
}: DashboardNavProps) {
  const pathname = usePathname()
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
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
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
                      className="w-full h-full object-contain object-left dark:brightness-0 dark:invert"
                      unoptimized
                    />
                  ) : (
                    <img
                      src={systemLogo}
                      alt="Logo"
                      className="w-full h-full object-contain object-left dark:brightness-0 dark:invert"
                    />
                  )}
                </div>
              ) : (
                <span className="text-xl font-bold">{systemName}</span>
              )}
            </Link>
            <div className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WhatsNewButton />
            <div className="text-sm text-foreground">
              <div className="font-medium">{user.name || user.email}</div>
              {user.position && (
                <div className="text-xs text-muted-foreground">{user.position}</div>
              )}
              {!user.position && user.role === "ADMIN" && (
                <div className="text-xs text-muted-foreground">Administrator</div>
              )}
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Ustawienia
              </Button>
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/signin" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

