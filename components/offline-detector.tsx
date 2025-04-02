"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine)

    // Add event listeners
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="offline-indicator flex items-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>Offline</span>
    </div>
  )
}

