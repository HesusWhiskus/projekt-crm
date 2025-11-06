import { db } from "@/lib/db"
import Image from "next/image"

export async function AuthHeader() {
  // Get system settings for branding
  let systemName = "Internal CRM"
  let systemLogo: string | null = null

  try {
    const [nameResult, logoResult] = await Promise.all([
      db.systemSettings.findUnique({ where: { key: "system_name" } }).catch(() => null),
      db.systemSettings.findUnique({ where: { key: "system_logo" } }).catch(() => null),
    ])

    if (nameResult?.value) {
      systemName = nameResult.value
    }
    if (logoResult?.value && logoResult.value.trim() !== "") {
      systemLogo = logoResult.value
    }
  } catch (error) {
    console.error("Error fetching system settings for auth page:", error)
    // Use defaults if error
  }

  return (
    <div className="flex flex-col items-center space-y-3 mb-6">
      {systemLogo && (
        <div className="relative w-24 h-16">
          {systemLogo.startsWith("http") ? (
            <Image
              src={systemLogo}
              alt="Logo"
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <img
              src={systemLogo}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      )}
      <h1 className="text-2xl font-bold">{systemName}</h1>
    </div>
  )
}

