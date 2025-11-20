"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  CheckSquare,
} from "lucide-react"
import { ProNavItems } from "@/components/pro-nav-items"
import { InsuranceNavItems } from "@/components/insurance-nav-items"

interface SidebarNavProps {
  enabledFeatures?: string[]
  isInsuranceAgent?: boolean
  collapsed?: boolean
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Klienci", href: "/clients", icon: Users },
  { name: "Kontakty", href: "/contacts", icon: FileText },
  { name: "Zadania", href: "/tasks", icon: CheckSquare },
  { name: "Kalendarz", href: "/calendar", icon: Calendar },
]

export function SidebarNav({
  enabledFeatures = [],
  isInsuranceAgent = false,
  collapsed = false,
}: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1" aria-label="Sidebar navigation">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center" : "justify-start",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.name : undefined}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0", !collapsed && "mr-3")} aria-hidden="true" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        )
      })}
      {!collapsed && (
        <>
          <div className="border-t border-border my-2" />
          <div className="space-y-1">
            <ProNavItems enabledFeatures={enabledFeatures} />
          </div>
          <div className="space-y-1">
            <InsuranceNavItems enabledFeatures={enabledFeatures} isInsuranceAgent={isInsuranceAgent} />
          </div>
        </>
      )}
    </nav>
  )
}

