"use client"

import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterSW() {
  const { toast } = useToast()

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registrato con successo:", registration)
          })
          .catch((error) => {
            console.error("Errore nella registrazione del Service Worker:", error)
          })
      })

      // Handle updates
      let refreshing = false
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })

      // Check for updates
      navigator.serviceWorker.ready.then((registration) => {
        // Check for updates every hour
        setInterval(
          () => {
            registration.update()
          },
          60 * 60 * 1000,
        )
      })
    }

    // Check if the app is installed or can be installed
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()

      // Store the event so it can be triggered later
      const deferredPrompt = e

      // Show install button or notification
      toast({
        title: "Installa StudyLab",
        description: "Aggiungi StudyLab alla tua schermata home per un accesso più rapido.",
        action: (
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 rounded-md px-3 text-xs"
            onClick={() => {
              // Show the install prompt
              deferredPrompt.prompt()

              // Wait for the user to respond to the prompt
              deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === "accepted") {
                  console.log("Utente ha accettato l'installazione")
                } else {
                  console.log("Utente ha rifiutato l'installazione")
                }
              })
            }}
          >
            Installa
          </button>
        ),
        duration: 10000,
      })
    })
  }, [toast])

  return null
}

