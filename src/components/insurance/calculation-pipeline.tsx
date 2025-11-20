"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Calculation {
  id: string
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
  client?: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
    type: string
  } | null
  vehicle?: {
    id: string
    vin: string | null
    registrationNumber: string | null
  } | null
  value?: number | null
  createdAt: Date
}

interface CalculationPipelineProps {
  calculations: Calculation[]
  onStatusChange?: (calculationId: string, newStatus: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED') => void
}

const statusColumns: Array<{ status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'; label: string; color: string }> = [
  { status: 'DRAFT', label: 'Szkice', color: 'bg-gray-100' },
  { status: 'SENT', label: 'Wysłane', color: 'bg-blue-100' },
  { status: 'ACCEPTED', label: 'Zaakceptowane', color: 'bg-green-100' },
  { status: 'REJECTED', label: 'Odrzucone', color: 'bg-red-100' },
]

export function CalculationPipeline({ calculations, onStatusChange }: CalculationPipelineProps) {
  const router = useRouter()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, calculationId: string) => {
    setDraggedItem(calculationId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', calculationId)
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED') => {
    e.preventDefault()
    const calculationId = e.dataTransfer.getData('text/plain')
    
    if (!calculationId) {
      setDraggedItem(null)
      setDragOverColumn(null)
      return
    }

    // Check if status is actually changing
    const calculation = calculations.find(c => c.id === calculationId)
    if (calculation && calculation.status === targetStatus) {
      setDraggedItem(null)
      setDragOverColumn(null)
      return
    }

    setUpdatingStatus(calculationId)

    try {
      if (onStatusChange) {
        await onStatusChange(calculationId, targetStatus)
      } else {
        // Default: call API directly
        const response = await fetch(`/api/calculations/${calculationId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus }),
        })

        if (!response.ok) {
          throw new Error('Nie udało się zmienić statusu')
        }
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Nie udało się zmienić statusu kalkulacji')
    } finally {
      setUpdatingStatus(null)
      setDraggedItem(null)
      setDragOverColumn(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const getCalculationsByStatus = (status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED') => {
    return calculations.filter(calc => calc.status === status)
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pipeline kalkulacji</h2>
          <p className="text-muted-foreground mt-1">
            Przeciągnij kalkulacje między kolumnami, aby zmienić ich status
          </p>
        </div>
        <Button asChild>
          <Link href="/insurance-agent/calculations/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowa kalkulacja
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((column) => {
          const columnCalculations = getCalculationsByStatus(column.status)
          const isDragOver = dragOverColumn === column.status

          return (
            <Card
              key={column.status}
              className={`min-h-[400px] ${isDragOver ? 'ring-2 ring-primary' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <CardHeader className={`${column.color} rounded-t-lg`}>
                <CardTitle className="text-sm font-medium">
                  {column.label} ({columnCalculations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {columnCalculations.map((calculation) => {
                  const isDragging = draggedItem === calculation.id
                  
                  return (
                    <div
                      key={calculation.id}
                      draggable={!updatingStatus}
                      onDragStart={(e) => handleDragStart(e, calculation.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 border rounded transition-all ${
                        updatingStatus === calculation.id ? 'opacity-50 cursor-wait' :
                        isDragging ? 'opacity-50 cursor-move' : 'cursor-move hover:shadow-md'
                      }`}
                    >
                      <Link
                        href={`/insurance-agent/calculations/${calculation.id}`}
                        onClick={(e) => {
                          if (isDragging) {
                            e.preventDefault()
                          }
                        }}
                        className="block"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {calculation.client?.type === 'COMPANY'
                                ? calculation.client.companyName || 'Brak nazwy'
                                : `${calculation.client?.firstName || ''} ${calculation.client?.lastName || ''}`.trim() || 'Brak nazwy'}
                            </p>
                            {calculation.vehicle && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {calculation.vehicle.registrationNumber || calculation.vehicle.vin || 'Brak pojazdu'}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[calculation.status] || 'bg-gray-100 text-gray-800'}`}>
                            {calculation.status}
                          </span>
                        </div>
                        {calculation.value && (
                          <p className="text-sm font-semibold text-green-600">
                            {typeof calculation.value === "number" ? calculation.value.toFixed(2) : Number(calculation.value).toFixed(2)} zł
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(calculation.createdAt).toLocaleDateString('pl-PL')}
                        </p>
                      </Link>
                    </div>
                  )
                })}
                {columnCalculations.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Brak kalkulacji
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

