"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-[98%] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-xl font-bold"
              style={{ color: "var(--color-primary, #3b82f6)" }}
            >
              {systemLogo && (
                <div className="relative w-8 h-8">
                  {systemLogo.startsWith("http") ? (
                    <Image
                      src={systemLogo}
                      alt="Logo"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <img
                      src={systemLogo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )}
              <span>{systemName}</span>
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
                        : "text-gray-700 hover:bg-gray-100"
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
            <div className="text-sm text-gray-700">
              <div className="font-medium">{user.name || user.email}</div>
              {user.position && (
                <div className="text-xs text-gray-500">{user.position}</div>
              )}
              {!user.position && user.role === "ADMIN" && (
                <div className="text-xs text-gray-500">Administrator</div>
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

