import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique ID
export function generateId(): string {
  return uuidv4()
}

// Format date to Italian locale
export function formatDate(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date)
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

// Format date with time to Italian locale
export function formatDateTime(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date)
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Get API endpoint from environment or settings
export function getApiEndpoint(): string {
  // First check if there's a public environment variable
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Default fallback
  return "http://localhost:3000/api"
}

// Check if the app is running in a PWA context
export function isPwa(): boolean {
  if (typeof window !== "undefined") {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  }
  return false
}

// Check if the device is online
export function isOnline(): boolean {
  if (typeof navigator !== "undefined") {
    return navigator.onLine
  }
  return true
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Read file as data URL
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

// Convert blob to file
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type })
}

// Extract text from HTML
export function extractTextFromHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

// Check if a date is today
export function isToday(date: Date | number): boolean {
  const today = new Date()
  const compareDate = new Date(date)
  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  )
}

