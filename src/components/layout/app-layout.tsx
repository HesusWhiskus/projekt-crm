"use client"

import { useState, ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SidebarContext } from "./sidebar-context"

export interface AppLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  sidebarCollapsed?: boolean
  onSidebarToggle?: (collapsed: boolean) => void
  className?: string
}

export function AppLayout({
  children,
  sidebar,
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle,
  className,
}: AppLayoutProps) {
  const isMobile = useIsMobile()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const setCollapsed = (value: boolean) => {
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(value)
    }
    onSidebarToggle?.(value)
  }

  // Na mobile zawsze ukryj sidebar (może być pokazany przez hamburger menu)
  const showSidebar = !isMobile && sidebar

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className={cn("flex flex-1 overflow-hidden", className)}>
        {showSidebar && (
          <aside
            className={cn(
              "border-r border-border bg-card transition-all duration-300 flex flex-col flex-shrink-0",
              collapsed ? "w-16" : "w-64"
            )}
            aria-label="Sidebar navigation"
          >
            <div className={cn("flex-1 overflow-y-auto", collapsed ? "p-2" : "p-4")}>
              {sidebar}
            </div>
            {!isMobile && (
              <div className="sticky bottom-0 border-t border-border bg-card p-2 shadow-[0_-4px_6px_-1px_rgb(0_0_0_/_0.1)]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  className="w-full"
                  aria-label={collapsed ? "Rozwiń sidebar" : "Zwiń sidebar"}
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  )
}

