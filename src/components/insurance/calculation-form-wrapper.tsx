"use client"

import { useRouter } from "next/navigation"
import { CalculationForm } from "./calculation-form"

export function CalculationFormWrapper() {
  const router = useRouter()

  return (
    <CalculationForm
      onClose={() => {
        router.push("/insurance-agent/calculations")
      }}
      onSuccess={() => {
        router.push("/insurance-agent/calculations")
      }}
    />
  )
}



