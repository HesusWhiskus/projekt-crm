"use client"

import { useRouter } from "next/navigation"
import { PolicyForm } from "./policy-form"

export function PolicyFormWrapper() {
  const router = useRouter()

  return (
    <PolicyForm
      onClose={() => {
        router.push("/insurance-agent/policies")
      }}
      onSuccess={() => {
        router.push("/insurance-agent/policies")
      }}
    />
  )
}




