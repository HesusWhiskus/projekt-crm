"use client"

import { ReactNode, useState } from "react"
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
  DragCancelEvent,
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
  enabled?: boolean
  order?: number
  gridCols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
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
  Component,
  activeId,
  overId,
}: {
  widget: WidgetConfig
  Component: React.ComponentType<any>
  activeId: string | null
  overId: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  const isOver = overId === widget.id && activeId !== widget.id
  const isActive = activeId === widget.id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isActive ? 0.3 : 1,
  }

  const gridColsClass = `
    ${widget.gridCols?.mobile === 2 ? "col-span-2" : ""}
    ${widget.gridCols?.tablet === 2 ? "md:col-span-2" : ""}
    ${widget.gridCols?.desktop === 2 ? "lg:col-span-2" : ""}
    ${widget.gridCols?.wide === 2 ? "xl:col-span-2" : ""}
  `

  return (
    <div ref={setNodeRef} style={style} className={gridColsClass}>
      {isOver && !isActive && (
        <div className="min-h-[200px] border-2 border-dashed border-primary rounded-lg bg-primary/5 transition-all animate-pulse" />
      )}
      <div className={`relative group ${isOver && !isActive ? "ring-2 ring-primary ring-offset-2 rounded-lg transition-all" : ""}`}>
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background border rounded p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Component {...(widget as any).props} />
      </div>
    </div>
  )
}

export function WidgetRegistry({ widgets, onWidgetUpdate }: WidgetRegistryProps) {
  const [items, setItems] = useState(() => {
    const enabledWidgets = widgets
      .filter((widget) => widget.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    return enabledWidgets
  })

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [originalItems, setOriginalItems] = useState<WidgetConfig[]>([])

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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setOverId(null)
      return
    }

    setOverId(over.id as string)

    setItems((currentItems) => {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id)
      const newIndex = currentItems.findIndex((item) => item.id === over.id)

      if (oldIndex !== newIndex && newIndex !== -1) {
        return arrayMove(currentItems, oldIndex, newIndex)
      }

      return currentItems
    })
  }

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
          onWidgetUpdate?.(item.id, { order: item.order })
        })

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "dashboard-widget-order",
            JSON.stringify(updatedItems.map((item) => ({ id: item.id, order: item.order })))
          )
        }

        return updatedItems
      })
    }
  }

  const getActiveWidget = () => {
    if (!activeId) return null
    return items.find((widget) => widget.id === activeId) || null
  }

  const renderWidget = (widget: WidgetConfig) => {
    if (widget.type === "stats") {
      return (
        <SortableWidget
          key={widget.id}
          widget={widget}
          Component={widgetComponents.stats}
          activeId={activeId}
          overId={overId}
        />
      )
    }
    if (widget.type === "chart") {
      return (
        <SortableWidget
          key={widget.id}
          widget={widget}
          Component={widgetComponents.chart}
          activeId={activeId}
          overId={overId}
        />
      )
    }
    if (widget.type === "list") {
      return (
        <SortableWidget
          key={widget.id}
          widget={widget}
          Component={widgetComponents.list}
          activeId={activeId}
          overId={overId}
        />
      )
    }
    return null
  }

  const renderDragOverlay = () => {
    const activeWidget = getActiveWidget()
    if (!activeWidget) return null

    if (activeWidget.type === "stats") {
      return <widgetComponents.stats {...(activeWidget as any).props} />
    }
    if (activeWidget.type === "chart") {
      return <widgetComponents.chart {...(activeWidget as any).props} />
    }
    if (activeWidget.type === "list") {
      return <widgetComponents.list {...(activeWidget as any).props} />
    }
    return null
  }

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
            mobile: 1,
            tablet: 2,
            desktop: 3,
            wide: 4,
          }}
          gap="md"
        >
          {items.map((widget) => renderWidget(widget))}
        </ResponsiveGrid>
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="opacity-90 rotate-2 shadow-lg">
            {renderDragOverlay()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

