"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useEffect } from "react"
import { get } from "@/lib/db"

export interface CustomTheme {
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  isBuiltIn?: boolean
}

export const defaultThemes: CustomTheme[] = [
  {
    name: "default",
    primary: "221.2 83.2% 53.3%",
    secondary: "210 40% 96.1%",
    accent: "210 40% 96.1%",
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    isBuiltIn: true,
  },
  {
    name: "dark",
    primary: "217.2 91.2% 59.8%",
    secondary: "217.2 32.6% 17.5%",
    accent: "217.2 32.6% 17.5%",
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    isBuiltIn: true,
  },
  {
    name: "purple",
    primary: "262.1 83.3% 57.8%",
    secondary: "260 60% 96.1%",
    accent: "262.1 83.3% 57.8%",
    background: "0 0% 100%",
    foreground: "224 71.4% 4.1%",
    isBuiltIn: true,
  },
  {
    name: "green",
    primary: "142.1 76.2% 36.3%",
    secondary: "140 60% 96.1%",
    accent: "142.1 76.2% 36.3%",
    background: "0 0% 100%",
    foreground: "220 14.3% 95.9%",
    isBuiltIn: true,
  },
  {
    name: "orange",
    primary: "24.6 95% 53.1%",
    secondary: "30 60% 96.1%",
    accent: "24.6 95% 53.1%",
    background: "0 0% 100%",
    foreground: "20 14.3% 4.1%",
    isBuiltIn: true,
  },
]

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Load custom themes from IndexedDB
  useEffect(() => {
    const loadCustomThemes = async () => {
      try {
        const settings = await get("settings", "user-settings")
        if (settings?.customThemes) {
          // Apply custom themes to CSS variables
          settings.customThemes.forEach((theme: CustomTheme) => {
            if (!theme.isBuiltIn) {
              document.documentElement.style.setProperty(`--custom-${theme.name}-primary`, theme.primary)
              document.documentElement.style.setProperty(`--custom-${theme.name}-secondary`, theme.secondary)
              document.documentElement.style.setProperty(`--custom-${theme.name}-accent`, theme.accent)
              document.documentElement.style.setProperty(`--custom-${theme.name}-background`, theme.background)
              document.documentElement.style.setProperty(`--custom-${theme.name}-foreground`, theme.foreground)
            }
          })
        }
      } catch (error) {
        console.error("Error loading custom themes:", error)
      }
    }

    loadCustomThemes()
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

