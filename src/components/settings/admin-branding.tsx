"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface AdminBrandingProps {
  systemName: string
  systemLogo: string | null
  onSave: (data: { systemName: string; logo?: File | null }) => Promise<void>
}

export function AdminBranding({
  systemName: initialSystemName,
  systemLogo: initialSystemLogo,
  onSave,
}: AdminBrandingProps) {
  const [systemName, setSystemName] = useState(initialSystemName)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSystemLogo)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg|svg)$/)) {
      setError("Nieprawidłowy format pliku. Dozwolone: PNG, JPG, SVG")
      return
    }

    // Validate file size (max 5MB - before conversion)
    if (file.size > 5 * 1024 * 1024) {
      setError("Plik jest zbyt duży. Maksymalny rozmiar: 5MB")
      return
    }

    setError(null)

    try {
      // Convert and resize image
      const convertedFile = await convertAndResizeLogo(file)
      setLogoFile(convertedFile)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(convertedFile)
    } catch (err: any) {
      setError(err.message || "Błąd podczas przetwarzania logo")
    }
  }

  const convertAndResizeLogo = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      // For SVG files, we need special handling
      if (file.type === "image/svg+xml" || file.type === "image/svg" || file.name.toLowerCase().endsWith(".svg")) {
        // SVG files are not easily resizable with canvas, so we'll just convert to data URL
        // The browser will handle the display scaling
        const reader = new FileReader()
        reader.onload = (e) => {
          // For SVG, we'll create a canvas with fixed size and render it
          const img = document.createElement("img")
          img.onload = () => {
            const maxWidth = 224
            const maxHeight = 64
            
            const originalWidth = img.width || 224
            const originalHeight = img.height || 64
            
            const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
            const width = Math.round(originalWidth * ratio)
            const height = Math.round(originalHeight * ratio)

            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext("2d")
            
            if (!ctx) {
              reject(new Error("Nie można utworzyć kontekstu canvas"))
              return
            }

            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Błąd podczas konwersji obrazu SVG"))
                  return
                }
                const convertedFile = new File([blob], "logo.png", { type: "image/png" })
                resolve(convertedFile)
              },
              "image/png",
              0.9
            )
          }
          img.onerror = () => {
            reject(new Error("Błąd podczas ładowania obrazu SVG"))
          }
          img.src = e.target?.result as string
        }
        reader.onerror = () => {
          reject(new Error("Błąd podczas odczytu pliku SVG"))
        }
        reader.readAsDataURL(file)
        return
      }

      // For PNG, JPG, JPEG - standard processing
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement("img")
        img.crossOrigin = "anonymous" // Important for CORS
        
        img.onload = () => {
          // Preferred size: 224x64px (w-56 h-16) with max height 64px
          // Always resize to fit within 224x64, maintaining aspect ratio
          const maxWidth = 224
          const maxHeight = 64
          
          // Get actual image dimensions
          const originalWidth = img.naturalWidth || img.width || 224
          const originalHeight = img.naturalHeight || img.height || 64
          
          // Calculate new dimensions maintaining aspect ratio
          // Always resize, even if image is smaller
          const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
          const width = Math.round(originalWidth * ratio)
          const height = Math.round(originalHeight * ratio)

          // Ensure minimum dimensions
          const finalWidth = Math.max(width, 1)
          const finalHeight = Math.max(height, 1)

          // Create canvas for resizing
          const canvas = document.createElement("canvas")
          canvas.width = finalWidth
          canvas.height = finalHeight
          const ctx = canvas.getContext("2d", { willReadFrequently: false })
          
          if (!ctx) {
            reject(new Error("Nie można utworzyć kontekstu canvas"))
            return
          }

          // Set white background for transparency
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(0, 0, finalWidth, finalHeight)

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight)

          // Convert to blob (PNG format for best quality)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Błąd podczas konwersji obrazu"))
                return
              }
              
              // Create File from blob
              const convertedFile = new File(
                [blob],
                "logo.png",
                { type: "image/png" }
              )
              resolve(convertedFile)
            },
            "image/png",
            0.95 // Higher quality
          )
        }
        img.onerror = (error) => {
          console.error("Image load error:", error)
          reject(new Error("Błąd podczas ładowania obrazu. Sprawdź czy plik jest poprawnym obrazem."))
        }
        img.src = e.target?.result as string
      }
      reader.onerror = () => {
        reject(new Error("Błąd podczas odczytu pliku"))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      await onSave({
        systemName,
        logo: logoFile,
      })
      setSuccess("Ustawienia zostały zapisane pomyślnie")
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas zapisywania ustawień")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalizacja systemu</CardTitle>
        <CardDescription>
          Dostosuj nazwę i logo systemu wyświetlane w interfejsie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 text-green-700 text-sm rounded-md">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="systemName">Nazwa systemu</Label>
            <Input
              id="systemName"
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Internal CRM"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Nazwa wyświetlana w nagłówku i tytule strony
            </p>
          </div>

          <div className="space-y-2">
            <Label>Logo systemu</Label>
            {logoPreview && (
              <div className="relative inline-block mb-3">
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                  {logoPreview.startsWith("data:") || logoPreview.startsWith("http") ? (
                    <Image
                      src={logoPreview}
                      alt="Logo systemu"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <img
                      src={logoPreview}
                      alt="Logo systemu"
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleLogoSelect}
                className="hidden"
                id="logo-upload"
                disabled={isLoading}
              />
              <label htmlFor="logo-upload">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={isLoading}
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {logoPreview ? "Zmień logo" : "Prześlij logo"}
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Preferowany rozmiar: 224x64px (proporcje 3.5:1). Format: PNG, JPG, SVG (max 5MB). 
              Obraz zostanie automatycznie przeskalowany i skonwertowany do PNG.
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Podgląd nagłówka</h3>
            <div className="p-4 border rounded-lg bg-muted">
              <div className="flex items-center space-x-3">
                {logoPreview && (
                  <div className="relative w-8 h-8">
                    {logoPreview.startsWith("data:") || logoPreview.startsWith("http") ? (
                      <Image
                        src={logoPreview}
                        alt="Logo"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                )}
                <span className="text-lg font-bold">{systemName}</span>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

