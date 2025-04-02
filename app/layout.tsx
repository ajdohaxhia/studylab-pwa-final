import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import RegisterSW from "@/components/register-sw"
import OfflineDetector from "@/components/offline-detector"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StudyLab - App per Studenti",
  description: "App per studenti di istituti tecnici, economici e tecnologici",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StudyLab",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Navbar />
          <main className="container mx-auto px-4 py-4">{children}</main>
          <Toaster />
          <RegisterSW />
          <OfflineDetector />
        </ThemeProvider>
      </body>
    </html>
  )
}

