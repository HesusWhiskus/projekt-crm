"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { StatsWidget, StatsWidgetProps } from "./stats-widget"
import { ChartWidget, ChartWidgetProps } from "./chart-widget"
import { ListWidget, ListWidgetProps } from "./list-widget"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

export type WidgetType = "stats" | "chart" | "list"

export interface BaseWidgetConfig {
  id: string
  type: WidgetType
  title: string
  enabled?: boolean  // Opcjonalne w input, zawsze zdefiniowane po normalizacji
  order?: number     // Opcjonalne w input, zawsze zdefiniowane po normalizacji
  size?: "small" | "large"  // Opcjonalne w input, zawsze zdefiniowane po normalizacji
  // Deprecated: gridCols - użyj size zamiast tego
  gridCols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
}

// Znormalizowany typ widgetu - wszystkie pola wymagane
export interface NormalizedWidgetConfig extends Omit<BaseWidgetConfig, 'enabled' | 'order' | 'size'> {
  enabled: boolean
  order: number
  size: "small" | "large"
}

export interface StatsWidgetConfig extends BaseWidgetConfig {
  type: "stats"
  props: StatsWidgetProps
}

export interface ChartWidgetConfig extends BaseWidgetConfig {
  type: "chart"
  props: ChartWidgetProps
}

export interface ListWidgetConfig extends BaseWidgetConfig {
  type: "list"
  props: ListWidgetProps
}

export type WidgetConfig = StatsWidgetConfig | ChartWidgetConfig | ListWidgetConfig

// Znormalizowane typy widgetów
export type NormalizedStatsWidgetConfig = NormalizedWidgetConfig & { type: "stats"; props: StatsWidgetProps }
export type NormalizedChartWidgetConfig = NormalizedWidgetConfig & { type: "chart"; props: ChartWidgetProps }
export type NormalizedListWidgetConfig = NormalizedWidgetConfig & { type: "list"; props: ListWidgetProps }
export type NormalizedWidgetConfigType = NormalizedStatsWidgetConfig | NormalizedChartWidgetConfig | NormalizedListWidgetConfig

export interface WidgetRegistryProps {
  widgets: WidgetConfig[]
  onWidgetUpdate?: (widgetId: string, updates: Partial<WidgetConfig>) => void
}

const widgetComponents = {
  stats: StatsWidget,
  chart: ChartWidget,
  list: ListWidget,
}

function SortableWidget({
  widget,
  activeId,
  overId,
}: {
  widget: NormalizedWidgetConfigType
  activeId: string | null
  overId: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: widget.id,
  })

  const isOver = overId === widget.id && activeId !== widget.id
  const isActive = activeId === widget.id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isActive ? 0.3 : 1,
  }

  // Determine size - prefer new 'size' field, fallback to gridCols for backward compatibility
  const widgetSize = widget.size || (widget.gridCols?.desktop === 2 || widget.gridCols?.wide === 2 ? "large" : "small")
  
  // Mały widget: 2 kolumny × 2 wiersze
  // Duży widget: 4 kolumny × 4 wiersze
  const sizeClasses = widgetSize === "large"
    ? "col-span-1 md:col-span-4 lg:col-span-4 xl:col-span-4 row-span-2 md:row-span-4 lg:row-span-4 xl:row-span-4"
    : "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 row-span-2 md:row-span-2 lg:row-span-2 xl:row-span-2"

  // Render widget based on type
  const renderWidgetContent = () => {
    if (widget.type === "stats") {
      return <widgetComponents.stats {...(widget as NormalizedStatsWidgetConfig).props} />
    }
    if (widget.type === "chart") {
      return <widgetComponents.chart {...(widget as NormalizedChartWidgetConfig).props} />
    }
    if (widget.type === "list") {
      return <widgetComponents.list {...(widget as NormalizedListWidgetConfig).props} />
    }
    return null
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative ${sizeClasses}`}>
      {isOver && !isActive && (
        <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg bg-primary/5 transition-all animate-pulse z-10 pointer-events-none" />
      )}
      <div className={`relative group ${isOver && !isActive ? "ring-2 ring-primary ring-offset-2 rounded-lg transition-all" : ""}`}>
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background border rounded p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {renderWidgetContent()}
      </div>
    </div>
  )
}

export function WidgetRegistry({ widgets, onWidgetUpdate }: WidgetRegistryProps) {
  // Funkcja pomocnicza do wczytania i merge konfiguracji
  const loadWidgetsConfig = useCallback((): NormalizedWidgetConfigType[] => {
    // Wczytaj konfigurację z localStorage
    let savedConfig: Record<string, { enabled?: boolean; order?: number; size?: "small" | "large" }> = {}
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dashboard-widget-config")
        if (saved) {
          savedConfig = JSON.parse(saved)
        }
      } catch (e) {
        console.warn("Failed to load widget config from localStorage", e)
      }
    }

    // Merge domyślnej konfiguracji z zapisaną
    const mergedWidgets: NormalizedWidgetConfigType[] = widgets.map((widget) => {
      const saved = savedConfig[widget.id]
      // Zapewnij że wszystkie wymagane pola są zdefiniowane
      const enabled = saved?.enabled !== undefined ? saved.enabled : (widget.enabled ?? true)
      const order = saved?.order !== undefined ? saved.order : (widget.order ?? 0)
      // Priorytet: saved?.size > widget.size > fallback z gridCols
      const size = saved?.size !== undefined 
        ? saved.size 
        : (widget.size || (widget.gridCols?.desktop === 2 || widget.gridCols?.wide === 2 ? "large" : "small"))
      
      return {
        ...widget,
        enabled,
        order,
        size: size as "small" | "large",
      } as NormalizedWidgetConfigType
    })

    const enabledWidgets = mergedWidgets
      .filter((widget) => widget.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    return enabledWidgets
  }, [widgets])

  const [items, setItems] = useState<NormalizedWidgetConfigType[]>(() => loadWidgetsConfig())

  // Aktualizuj widgety gdy zmienią się props widgets
  useEffect(() => {
    setItems(loadWidgetsConfig())
  }, [loadWidgetsConfig])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [originalItems, setOriginalItems] = useState<NormalizedWidgetConfigType[]>(() => [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setOriginalItems([...items])
  }

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setOverId(null)
      return
    }

    const newOverId = over.id as string
    setOverId((currentOverId) => {
      // Only update if changed to avoid unnecessary re-renders
      if (currentOverId === newOverId) return currentOverId
      return newOverId
    })

    setItems((currentItems) => {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id)
      const newIndex = currentItems.findIndex((item) => item.id === over.id)

      // Only update if indices actually changed
      if (oldIndex !== newIndex && newIndex !== -1 && oldIndex !== -1) {
        return arrayMove(currentItems, oldIndex, newIndex)
      }

      return currentItems
    })
  }, [])

  const handleDragCancel = () => {
    setItems(originalItems)
    setActiveId(null)
    setOverId(null)
    setOriginalItems([])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setOverId(null)
    setOriginalItems([])

    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id)
        const newIndex = currentItems.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(currentItems, oldIndex, newIndex)

        // Update order for each widget
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }))

        // Call onWidgetUpdate for each moved widget
        updatedItems.forEach((item) => {
          onWidgetUpdate?.(item.id, { order: item.order, size: item.size })
        })

        // Save to localStorage - pełna konfiguracja (enabled, order, size)
        if (typeof window !== "undefined") {
          const config: Record<string, { enabled: boolean; order: number; size?: "small" | "large" }> = {}
          updatedItems.forEach((item) => {
            config[item.id] = {
              enabled: item.enabled !== false,
              order: item.order || 0,
              size: item.size,
            }
          })
          localStorage.setItem("dashboard-widget-config", JSON.stringify(config))
          
          // Zachowaj backward compatibility z starym kluczem
          localStorage.setItem(
            "dashboard-widget-order",
            JSON.stringify(updatedItems.map((item) => ({ id: item.id, order: item.order })))
          )
        }

        return updatedItems
      })
    }
  }


  const renderWidget = (widget: NormalizedWidgetConfigType) => {
    return (
      <SortableWidget
        key={widget.id}
        widget={widget}
        activeId={activeId}
        overId={overId}
      />
    )
  }

  const dragOverlayContent = useMemo(() => {
    if (!activeId) return null
    const activeWidget = items.find((widget) => widget.id === activeId)
    if (!activeWidget) return null

    if (activeWidget.type === "stats") {
      return <widgetComponents.stats key={activeWidget.id} {...(activeWidget as NormalizedStatsWidgetConfig).props} />
    }
    if (activeWidget.type === "chart") {
      return <widgetComponents.chart key={activeWidget.id} {...(activeWidget as NormalizedChartWidgetConfig).props} />
    }
    if (activeWidget.type === "list") {
      return <widgetComponents.list key={activeWidget.id} {...(activeWidget as NormalizedListWidgetConfig).props} />
    }
    return null
  }, [activeId, items])

  if (items.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((w) => w.id)} strategy={rectSortingStrategy}>
        <ResponsiveGrid
          columns={{
            mobile: 2,  // 2 kolumny na mobile
            tablet: 4,  // 4 kolumny na tablet
            desktop: 8, // 8 kolumn na desktop
            wide: 8,    // 8 kolumn na wide
          }}
          gap="md"
        >
          {items.map((widget) => renderWidget(widget))}
        </ResponsiveGrid>
      </SortableContext>
      <DragOverlay>
        {dragOverlayContent ? (
          <div key={`overlay-${activeId}`} className="opacity-90 rotate-2 shadow-lg">
            {dragOverlayContent}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

