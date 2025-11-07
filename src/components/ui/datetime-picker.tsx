"use client"

import { Input } from "./input"
import { Label } from "./label"

interface DateTimePickerProps {
  id?: string
  label?: string
  value: string // Format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
}: DateTimePickerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id}>{label}{required && " *"}</Label>
      )}
      <Input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full"
        step="60"
      />
    </div>
  )
}

