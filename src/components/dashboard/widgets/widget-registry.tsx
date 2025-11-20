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
}: {
  widget: WidgetConfig
  Component: React.ComponentType<any>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const gridColsClass = `
    ${widget.gridCols?.mobile === 2 ? "col-span-2" : ""}
    ${widget.gridCols?.tablet === 2 ? "md:col-span-2" : ""}
    ${widget.gridCols?.desktop === 2 ? "lg:col-span-2" : ""}
    ${widget.gridCols?.wide === 2 ? "xl:col-span-2" : ""}
  `

  return (
    <div ref={setNodeRef} style={style} className={gridColsClass}>
      <div className="relative group">
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)

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

  if (items.length === 0) {
    return null
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
          {items.map((widget) => {
            if (widget.type === "stats") {
              return (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  Component={widgetComponents.stats}
                />
              )
            }
            if (widget.type === "chart") {
              return (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  Component={widgetComponents.chart}
                />
              )
            }
            if (widget.type === "list") {
              return (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  Component={widgetComponents.list}
                />
              )
            }
            return null
          })}
        </ResponsiveGrid>
      </SortableContext>
    </DndContext>
  )
}

