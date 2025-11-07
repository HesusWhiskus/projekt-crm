import Image from "next/image"

interface AuthHeaderProps {
  systemName: string
  systemLogo: string | null
}

export function AuthHeader({ systemName, systemLogo }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center space-y-3 mb-4">
      {systemLogo ? (
        <>
          <div className="relative w-64 h-20 flex items-center justify-center overflow-hidden">
            {systemLogo.startsWith("http") ? (
              <Image
                src={systemLogo}
                alt={systemName}
                width={256}
                height={80}
                className="w-full h-full object-contain dark:brightness-0 dark:invert"
                unoptimized
              />
            ) : (
              <img
                src={systemLogo}
                alt={systemName}
                className="w-full h-full object-contain dark:brightness-0 dark:invert"
              />
            )}
          </div>
          <h1 className="text-2xl font-bold">{systemName}</h1>
        </>
      ) : (
        <h1 className="text-2xl font-bold">{systemName}</h1>
      )}
    </div>
  )
}

