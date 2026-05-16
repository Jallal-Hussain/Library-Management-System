"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CalendarRange, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export type DateRangeValue = {
  preset: "7d" | "30d" | "90d" | "180d" | "365d" | "all" | "custom"
  start?: string
  end?: string
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  className?: string
}

const presets = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "180d", label: "Last 6 months" },
  { value: "365d", label: "Last year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
] as const

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [draftStart, setDraftStart] = useState(value.start || "")
  const [draftEnd, setDraftEnd] = useState(value.end || "")

  const selectedLabel = useMemo(
    () => presets.find((p) => p.value === value.preset)?.label || "Select range",
    [value.preset],
  )

  const handlePresetChange = (preset: DateRangeValue["preset"]) => {
    if (preset !== "custom") {
      onChange({ preset, start: undefined, end: undefined })
    } else {
      onChange({ preset, start: draftStart, end: draftEnd })
    }
  }

  const applyCustomRange = () => {
    onChange({ preset: "custom", start: draftStart, end: draftEnd })
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
        <Select value={value.preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{selectedLabel}</span>
      </div>

      {value.preset === "custom" && (
        <div className="grid gap-3 sm:grid-cols-[1fr,1fr,auto] items-end">
          <div className="space-y-1">
            <Label htmlFor="start-date">Start date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="start-date"
                type="date"
                className="pl-9"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-date">End date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="end-date"
                type="date"
                className="pl-9"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                min={draftStart || undefined}
              />
            </div>
          </div>
          <Button onClick={applyCustomRange} disabled={!draftStart || !draftEnd}>
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}

