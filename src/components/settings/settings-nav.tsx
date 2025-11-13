"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  User,
  Lock,
  Palette,
  Settings as SettingsIcon,
  Crown,
  Key,
  Webhook,
  FileEdit,
} from "lucide-react"
import { FEATURE_KEYS } from "@/lib/feature-flags"

interface SettingsNavProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: "ADMIN" | "USER"
  }
  enabledFeatures?: string[]
}

const userNavItems = [
  { name: "Profil", href: "/settings/profile", icon: User },
  { name: "Bezpieczeństwo", href: "/settings/security", icon: Lock },
  { name: "Preferencje", href: "/settings/preferences", icon: Palette },
]

const adminNavItems = [
  { name: "Ustawienia systemowe", href: "/settings/admin", icon: Crown },
]

const proNavItems = [
  { name: "Klucze API", href: "/settings/api-keys", icon: Key, featureKey: FEATURE_KEYS.API_KEYS },
  { name: "Webhooks", href: "/settings/webhooks", icon: Webhook, featureKey: FEATURE_KEYS.WEBHOOKS },
  { name: "Niestandardowe pola", href: "/settings/custom-fields", icon: FileEdit, featureKey: FEATURE_KEYS.CUSTOM_FIELDS },
]

export function SettingsNav({ user, enabledFeatures = [] }: SettingsNavProps) {
  const pathname = usePathname()

  const visibleProItems = proNavItems.filter(
    (item) => enabledFeatures.includes(item.featureKey)
  )

  return (
    <nav className="space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Ustawienia</h2>
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
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      {visibleProItems.length > 0 && (
        <>
          <div className="my-4 border-t border-gray-200"></div>
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Funkcje PRO
            </p>
          </div>
          <div className="space-y-1">
            {visibleProItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
        </>
      )}

      {user.role === "ADMIN" && (
        <>
          <div className="my-4 border-t border-gray-200"></div>
          <div className="mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                      : "text-foreground hover:bg-muted"
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

