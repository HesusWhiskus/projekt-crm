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

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg|svg)$/)) {
      setError("Nieprawidłowy format pliku. Dozwolone: PNG, JPG, SVG")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Plik jest zbyt duży. Maksymalny rozmiar: 2MB")
      return
    }

    setLogoFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
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
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
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
              Format: PNG, JPG, SVG (max 2MB)
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Podgląd nagłówka</h3>
            <div className="p-4 border rounded-lg bg-gray-50">
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

