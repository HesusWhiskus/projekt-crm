"use client"

import { useRouter } from "next/navigation"
import { VehicleForm } from "./vehicle-form"

export function VehicleFormWrapper() {
  const router = useRouter()

  return (
    <VehicleForm
      onClose={() => {
        router.push("/insurance-agent/vehicles")
      }}
      onSuccess={() => {
        router.push("/insurance-agent/vehicles")
      }}
    />
  )
}




