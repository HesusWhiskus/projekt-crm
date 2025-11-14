"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
  limit: number
}

export function Pagination({ currentPage, totalPages, total, limit }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    router.push(`/clients?${params.toString()}`)
  }

  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, total)

  // Generuj numery stron do wyświetlenia
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      // Jeśli mniej niż maxVisible stron, pokaż wszystkie
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Zawsze pokaż pierwszą stronę
      pages.push(1)

      // Oblicz zakres stron wokół aktualnej strony
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Jeśli jest przerwa na początku, dodaj elipsę
      if (start > 2) {
        pages.push('...')
      }

      // Dodaj strony wokół aktualnej
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Jeśli jest przerwa na końcu, dodaj elipsę
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Zawsze pokaż ostatnią stronę
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Pokazuje {startItem}-{endItem} z {total} wyników
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Poprzednia
        </Button>
        
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              )
            }
            
            const pageNum = page as number
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Następna
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

