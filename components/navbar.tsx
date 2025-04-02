"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { BookOpen, BrainCircuit, Calendar, FileText, FlaskConical, Menu, Settings, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const routes = [
    {
      href: "/note",
      label: "Note",
      icon: FileText,
      active: pathname === "/note" || pathname?.startsWith("/note/"),
    },
    {
      href: "/mappe",
      label: "Mappe Mentali",
      icon: BrainCircuit,
      active: pathname === "/mappe" || pathname?.startsWith("/mappe/"),
    },
    {
      href: "/flashcard",
      label: "Flashcard",
      icon: FlaskConical,
      active: pathname === "/flashcard" || pathname?.startsWith("/flashcard/"),
    },
    {
      href: "/attivita",
      label: "Attività",
      icon: Calendar,
      active: pathname === "/attivita",
    },
    {
      href: "/ai",
      label: "Assistente AI",
      icon: Sparkles,
      active: pathname === "/ai",
    },
    {
      href: "/impostazioni",
      label: "Impostazioni",
      icon: Settings,
      active: pathname === "/impostazioni",
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5" />
          <span>StudyLab</span>
        </Link>

        <nav className="hidden md:flex ml-auto items-center gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`text-sm font-medium transition-colors flex items-center gap-1 hover:text-primary ${
                route.active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
          <ModeToggle />
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden ml-auto">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
              <BookOpen className="h-5 w-5" />
              <span>StudyLab</span>
            </Link>
            <nav className="mt-8 flex flex-col gap-4">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={`text-sm font-medium transition-colors flex items-center gap-2 hover:text-primary ${
                    route.active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <route.icon className="h-4 w-4" />
                  {route.label}
                </Link>
              ))}
              <div className="mt-2">
                <ModeToggle />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

