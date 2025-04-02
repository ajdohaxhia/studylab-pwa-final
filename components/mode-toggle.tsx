"use client"

import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { defaultThemes } from "./theme-provider"
import { get } from "@/lib/db"
import Link from "next/link"
import { Settings } from "lucide-react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [customThemes, setCustomThemes] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  // Load custom themes
  useEffect(() => {
    const loadCustomThemes = async () => {
      try {
        const settings = await get("settings", "user-settings")
        if (settings?.customThemes) {
          setCustomThemes(settings.customThemes.filter((t: any) => !t.isBuiltIn))
        }
      } catch (error) {
        console.error("Error loading custom themes:", error)
      }
    }

    loadCustomThemes()
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100" />
        <span className="sr-only">Cambia tema</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="btn-click">
          {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
          {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
          {theme !== "light" && theme !== "dark" && <Palette className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Cambia tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-scale-in">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Chiaro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Scuro</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Built-in themes */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Temi predefiniti</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {defaultThemes
                .filter((t) => !["default", "dark"].includes(t.name))
                .map((themeOption) => (
                  <DropdownMenuItem key={themeOption.name} onClick={() => setTheme(themeOption.name)}>
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: `hsl(${themeOption.primary})` }}
                    />
                    <span className="capitalize">{themeOption.name}</span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {/* Custom themes */}
        {customThemes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                <span>Temi personalizzati</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {customThemes.map((themeOption) => (
                    <DropdownMenuItem key={themeOption.name} onClick={() => setTheme(themeOption.name)}>
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: `hsl(${themeOption.primary})` }}
                      />
                      <span>{themeOption.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/impostazioni?tab=appearance" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Personalizza tema</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

