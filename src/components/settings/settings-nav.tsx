"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserRole } from "@prisma/client"
import {
  User,
  Lock,
  Palette,
  Settings as SettingsIcon,
  Crown,
} from "lucide-react"

interface SettingsNavProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
}

const userNavItems = [
  { name: "Profil", href: "/settings/profile", icon: User },
  { name: "Bezpieczeństwo", href: "/settings/security", icon: Lock },
  { name: "Preferencje", href: "/settings/preferences", icon: Palette },
]

const adminNavItems = [
  { name: "Ustawienia systemowe", href: "/settings/admin", icon: Crown },
]

export function SettingsNav({ user }: SettingsNavProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Ustawienia</h2>
      </div>

      <div className="space-y-1">
        {userNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

      {user.role === "ADMIN" && (
        <>
          <div className="my-4 border-t border-gray-200"></div>
          <div className="mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administrator
            </p>
          </div>
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
        </>
      )}
    </nav>
  )
}

