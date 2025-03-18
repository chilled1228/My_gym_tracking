"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle, AlertCircle, CloudOff } from "lucide-react"
import { toast } from "sonner"

interface DataSaveIndicatorProps {
  status: "saving" | "saved" | "error" | "offline" | "idle"
  message?: string
  className?: string
  autoHideDuration?: number
}

export function DataSaveIndicator({
  status,
  message,
  className = "",
  autoHideDuration = 3000
}: DataSaveIndicatorProps) {
  const [visible, setVisible] = useState(status !== "idle")
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Show indicator when status changes from idle
  useEffect(() => {
    if (status !== "idle") {
      setVisible(true)
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      
      // Auto-hide after duration if status is "saved"
      if (status === "saved" && autoHideDuration > 0) {
        timerRef.current = setTimeout(() => {
          setVisible(false)
        }, autoHideDuration)
      }
      
      // Show toast for error
      if (status === "error") {
        toast.error(message || "Failed to save data")
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [status, message, autoHideDuration])

  if (!visible) return null

  return (
    <div 
      className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      {status === "saving" && (
        <>
          <div className="h-4 w-4 animate-pulse rounded-full bg-blue-500"></div>
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      
      {status === "saved" && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">{message || "Saved to Supabase"}</span>
        </>
      )}
      
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">{message || "Failed to save"}</span>
        </>
      )}
      
      {status === "offline" && (
        <>
          <CloudOff className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground">{message || "Offline - changes will sync when online"}</span>
        </>
      )}
    </div>
  )
}

// Hook to manage save status
export function useSaveStatus() {
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "error" | "offline" | "idle">("idle")
  const [statusMessage, setStatusMessage] = useState<string>("")
  
  const setSaving = () => {
    setSaveStatus("saving")
    setStatusMessage("")
  }
  
  const setSaved = (message?: string) => {
    setSaveStatus("saved")
    setStatusMessage(message || "")
    
    // Reset to idle after 3 seconds
    setTimeout(() => {
      setSaveStatus("idle")
    }, 3000)
  }
  
  const setError = (message?: string) => {
    setSaveStatus("error")
    setStatusMessage(message || "")
  }
  
  const setOffline = (message?: string) => {
    setSaveStatus("offline")
    setStatusMessage(message || "")
  }
  
  return {
    saveStatus,
    statusMessage,
    setSaving,
    setSaved,
    setError,
    setOffline
  }
} 