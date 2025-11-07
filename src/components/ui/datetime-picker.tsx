"use client"

import { useState, useEffect } from "react"
import { Input } from "./input"
import { Select } from "./select"
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
  // Parse value into date, hour, minute
  const parseValue = (val: string) => {
    if (!val) {
      const now = new Date()
      return {
        date: now.toISOString().split("T")[0],
        hour: now.getHours().toString().padStart(2, "0"),
        minute: Math.floor(now.getMinutes() / 5) * 5, // Round to nearest 5 minutes
      }
    }

    const [datePart, timePart] = val.split("T")
    const [hour, minute] = timePart ? timePart.split(":") : ["00", "00"]
    
    return {
      date: datePart || "",
      hour: hour || "00",
      minute: Math.floor(parseInt(minute || "0") / 5) * 5, // Round to nearest 5 minutes
    }
  }

  const [dateValue, setDateValue] = useState(parseValue(value).date)
  const [hourValue, setHourValue] = useState(parseValue(value).hour)
  const [minuteValue, setMinuteValue] = useState(parseValue(value).minute.toString().padStart(2, "0"))

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      const parsed = parseValue(value)
      setDateValue(parsed.date)
      setHourValue(parsed.hour)
      setMinuteValue(parsed.minute.toString().padStart(2, "0"))
    }
  }, [value])

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

  // Generate minute options (0-59, step 5)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  const handleDateChange = (newDate: string) => {
    setDateValue(newDate)
    const newValue = `${newDate}T${hourValue}:${minuteValue}`
    onChange(newValue)
  }

  const handleHourChange = (newHour: string) => {
    setHourValue(newHour)
    const newValue = `${dateValue}T${newHour}:${minuteValue}`
    onChange(newValue)
  }

  const handleMinuteChange = (newMinute: string) => {
    setMinuteValue(newMinute)
    const newValue = `${dateValue}T${hourValue}:${newMinute}`
    onChange(newValue)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id}>{label}{required && " *"}</Label>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Input
            id={id ? `${id}-date` : undefined}
            type="date"
            value={dateValue}
            onChange={(e) => handleDateChange(e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div>
          <Select
            id={id ? `${id}-hour` : undefined}
            value={hourValue}
            onChange={(e) => handleHourChange(e.target.value)}
            disabled={disabled}
            className="w-full"
          >
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Select
            id={id ? `${id}-minute` : undefined}
            value={minuteValue}
            onChange={(e) => handleMinuteChange(e.target.value)}
            disabled={disabled}
            className="w-full"
          >
            {minuteOptions.map((minute) => (
              <option key={minute} value={minute}>
                {minute}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}

