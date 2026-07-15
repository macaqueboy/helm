import * as React from "react"
import { Button } from "@/components/brutal/button"
import { cn } from "@/lib/utils"

interface AlertBarProps {
  variant?: "success" | "error" | "warning" | "info"
  message: string
  onClose?: () => void
}

export function AlertBar({ variant = "info", message, onClose }: AlertBarProps) {
  const variants = {
    success: "bg-brutal-lime",
    error: "bg-brutal-red text-white",
    warning: "bg-brutal-yellow",
    info: "bg-brutal-cyan text-black",
  }

  return (
    <div className={cn("border-b-2 border-black px-4 py-3 flex items-center justify-between gap-4", variants[variant])}>
      <span className="font-bold font-space-mono text-sm">{message}</span>
      {onClose && (
        <Button variant="ghost" size="sm" onClick={onClose} className="!shadow-none">
          ✕
        </Button>
      )}
    </div>
  )
}