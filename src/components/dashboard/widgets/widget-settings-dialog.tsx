"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { WidgetConfig } from "./widget-registry"
import { Settings2 } from "lucide-react"

interface WidgetSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widgets: WidgetConfig[]
  onSave: () => void
}

export function WidgetSettingsDialog({
  open,
  onOpenChange,
  widgets,
  onSave,
}: WidgetSettingsDialogProps) {
  // Wczytaj aktualną konfigurację z localStorage
  const [config, setConfig] = useState<Record<string, { enabled: boolean; order: number; size?: "small" | "large" }>>({})

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dashboard-widget-config")
        if (saved) {
          const savedConfig = JSON.parse(saved)
          setConfig(savedConfig)
        } else {
          // Utwórz domyślną konfigurację z widgetów
          const defaultConfig: Record<string, { enabled: boolean; order: number; size?: "small" | "large" }> = {}
          widgets.forEach((widget) => {
            defaultConfig[widget.id] = {
              enabled: widget.enabled !== false,
              order: widget.order || 0,
              size: widget.size || "small",
            }
          })
          setConfig(defaultConfig)
        }
      } catch (e) {
        console.warn("Failed to load widget config", e)
        // Utwórz domyślną konfigurację
        const defaultConfig: Record<string, { enabled: boolean; order: number; size?: "small" | "large" }> = {}
        widgets.forEach((widget) => {
          defaultConfig[widget.id] = {
            enabled: widget.enabled !== false,
            order: widget.order || 0,
            size: widget.size || "small",
          }
        })
        setConfig(defaultConfig)
      }
    }
  }, [open, widgets])

  const handleToggleWidget = (widgetId: string) => {
    setConfig((prev) => ({
      ...prev,
      [widgetId]: {
        ...prev[widgetId],
        enabled: !prev[widgetId]?.enabled,
      },
    }))
  }

  const handleSizeChange = (widgetId: string, size: "small" | "large") => {
    setConfig((prev) => ({
      ...prev,
      [widgetId]: {
        ...prev[widgetId],
        size,
      },
    }))
  }

  const handleSave = () => {
    // Zapisz do localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard-widget-config", JSON.stringify(config))
    }
    onSave()
    onOpenChange(false)
    // Odśwież stronę aby zastosować zmiany
    window.location.reload()
  }

  // Sortuj widgety według order
  const sortedWidgets = [...widgets].sort((a, b) => {
    const orderA = config[a.id]?.order ?? a.order ?? 0
    const orderB = config[b.id]?.order ?? b.order ?? 0
    return orderA - orderB
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Konfiguracja widgetów dashboardu
          </DialogTitle>
          <DialogDescription>
            Wybierz które widgety mają być widoczne na dashboardzie i ustaw ich rozmiary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {sortedWidgets.map((widget) => {
            const widgetConfig = config[widget.id] || {
              enabled: widget.enabled !== false,
              order: widget.order || 0,
              size: widget.size || "small",
            }

            return (
              <div
                key={widget.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={widgetConfig.enabled}
                    onCheckedChange={() => handleToggleWidget(widget.id)}
                    id={`widget-${widget.id}`}
                  />
                  <Label
                    htmlFor={`widget-${widget.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{widget.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {widget.type === "stats" && "Widget statystyczny"}
                      {widget.type === "list" && "Widget listy"}
                      {widget.type === "chart" && "Widget wykresu"}
                    </div>
                  </Label>
                </div>

                {widgetConfig.enabled && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`size-${widget.id}`} className="text-sm">
                      Rozmiar:
                    </Label>
                    <Select
                      value={widgetConfig.size || "small"}
                      onValueChange={(value) =>
                        handleSizeChange(widget.id, value as "small" | "large")
                      }
                    >
                      <SelectTrigger id={`size-${widget.id}`} className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Mały (2×2)</SelectItem>
                        <SelectItem value="large">Duży (4×4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

