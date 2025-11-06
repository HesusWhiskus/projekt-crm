import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth-header"
import SignInForm from "./signin-form"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <AuthHeader />
          <CardTitle className="text-2xl text-center">Logowanie</CardTitle>
          <CardDescription className="text-center">
            Zaloguj się do systemu
          </CardDescription>
        </CardHeader>
        <Suspense
          fallback={
            <CardContent>
              <div className="text-center">Ładowanie...</div>
            </CardContent>
          }
        >
          <SignInForm />
        </Suspense>
      </Card>
    </div>
  )
}
