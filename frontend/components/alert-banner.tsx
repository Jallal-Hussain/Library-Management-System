"use client"

import { X, AlertTriangle, Clock, Bell, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AlertBannerProps {
  type: "warning" | "error" | "info" | "success"
  title: string
  message: string
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function AlertBanner({ type, title, message, onDismiss, action }: AlertBannerProps) {
  const styles = {
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: Clock,
      iconColor: "text-amber-600",
      titleColor: "text-amber-800",
      textColor: "text-amber-700",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      titleColor: "text-red-800",
      textColor: "text-red-700",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: Bell,
      iconColor: "text-blue-600",
      titleColor: "text-blue-800",
      textColor: "text-blue-700",
    },
    success: {
      bg: "bg-green-50 border-green-200",
      icon: CheckCircle,
      iconColor: "text-green-600",
      titleColor: "text-green-800",
      textColor: "text-green-700",
    },
  }

  const { bg, icon: Icon, iconColor, titleColor, textColor } = styles[type]

  return (
    <div className={cn("rounded-lg border p-4", bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-medium", titleColor)}>{title}</h4>
          <p className={cn("text-sm mt-1", textColor)}>{message}</p>
          {action && (
            <Button variant="link" className={cn("h-auto p-0 mt-2 font-medium", titleColor)} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
        {onDismiss && (
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
