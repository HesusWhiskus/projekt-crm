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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "./sidebar-context"

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
  collapsed: propCollapsed,
}: SidebarNavProps) {
  const pathname = usePathname()
  const { collapsed: contextCollapsed } = useSidebar()
  const collapsed = propCollapsed !== undefined ? propCollapsed : contextCollapsed

  return (
    <nav className="space-y-1" aria-label="Sidebar navigation">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const linkContent = (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center" : "justify-start",
              isActive
                ? "sidebar-active-ibooster"
                : "text-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.name : undefined}
          >
            <Icon className={cn(
              "h-5 w-5 flex-shrink-0",
              !collapsed && "mr-3",
              isActive ? "text-white" : "text-muted-foreground"
            )} aria-hidden="true" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        )

        if (collapsed) {
          return (
            <TooltipProvider key={item.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }

        return linkContent
      })}
      {!collapsed && (
        <>
          <div className="border-t border-border my-2" />
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Funkcje PRO</div>
          </div>
        </>
      )}
      <div className="space-y-1">
        <ProNavItems enabledFeatures={enabledFeatures} collapsed={collapsed} />
      </div>
      {!collapsed && enabledFeatures.includes("insurance_agents") && isInsuranceAgent && (
        <>
          <div className="border-t border-border my-2" />
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase">Agenci ubezpieczeniowi</div>
          </div>
        </>
      )}
      <div className="space-y-1">
        <InsuranceNavItems enabledFeatures={enabledFeatures} isInsuranceAgent={isInsuranceAgent} collapsed={collapsed} />
      </div>
    </nav>
  )
}

