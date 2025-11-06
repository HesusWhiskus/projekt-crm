import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth-header"
import SignUpForm from "./signup-form"

export default async function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Suspense fallback={<div className="h-20" />}>
            <AuthHeader />
          </Suspense>
          <CardTitle className="text-2xl text-center">Rejestracja</CardTitle>
          <CardDescription className="text-center">
            Utwórz nowe konto w systemie
          </CardDescription>
        </CardHeader>
        <SignUpForm />
      </Card>
    </div>
  )
}
