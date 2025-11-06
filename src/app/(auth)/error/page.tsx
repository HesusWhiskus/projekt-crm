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
    OAuthSignin: "Błąd podczas logowania przez Google. Sprawdź konfigurację OAuth w ustawieniach aplikacji.",
    OAuthCallback: "Błąd podczas przetwarzania odpowiedzi z Google. Sprawdź czy callback URL jest poprawnie skonfigurowany.",
    OAuthCreateAccount: "Nie można utworzyć konta przez Google OAuth.",
    EmailCreateAccount: "Nie można utworzyć konta przez email.",
    Callback: "Błąd podczas przetwarzania callback OAuth.",
    OAuthAccountNotLinked: "Konto Google jest już powiązane z innym kontem. Zaloguj się używając oryginalnej metody logowania.",
    EmailSignin: "Błąd podczas wysyłania emaila.",
    SessionRequired: "Musisz być zalogowany aby uzyskać dostęp do tej strony.",
    Default: "Wystąpił nieoczekiwany błąd podczas autoryzacji.",
  }

  const error = searchParams.error || "Default"
  const message = errorMessages[error] || errorMessages.Default
  const isOAuthError = error === "OAuthSignin" || error === "OAuthCallback" || error === "Callback"

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
          {isOAuthError && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <p className="font-semibold mb-2">Rozwiązywanie problemów z Google OAuth:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Sprawdź czy <code className="bg-yellow-100 px-1 rounded">NEXTAUTH_URL</code> jest poprawnie ustawiony w zmiennych środowiskowych</li>
                <li>Upewnij się, że callback URL w Google Cloud Console to: <code className="bg-yellow-100 px-1 rounded">https://twoja-domena.railway.app/api/auth/callback/google</code></li>
                <li>Sprawdź czy <code className="bg-yellow-100 px-1 rounded">GOOGLE_CLIENT_ID</code> i <code className="bg-yellow-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> są poprawne</li>
              </ul>
            </div>
          )}
          <Button asChild className="w-full">
            <Link href="/signin">Powrót do logowania</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

