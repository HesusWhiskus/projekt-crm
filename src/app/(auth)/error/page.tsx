import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    Configuration: "Wystąpił problem z konfiguracją serwera.",
    AccessDenied: "Nie masz uprawnień do dostępu.",
    Verification: "Link weryfikacyjny wygasł lub został już użyty.",
    CredentialsSignin: "Nieprawidłowy email lub hasło.",
    Default: "Wystąpił nieoczekiwany błąd podczas autoryzacji.",
  }

  const error = searchParams.error || "Default"
  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-destructive">
            Błąd autoryzacji
          </CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/signin">Powrót do logowania</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

