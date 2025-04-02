import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BrainCircuit, Calendar, FileText, FlaskConical, CalendarDaysIcon } from "lucide-react"

export default function Home() {
  return (
    <div className="space-y-8 pb-10">
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Benvenuto su StudyLab</h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                La tua piattaforma di studio completa. Prendi appunti, crea mappe mentali, studia con flashcard e
                gestisci i tuoi compiti - tutto senza bisogno di registrazione.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/note">
                <Button size="lg">Inizia a Studiare</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Note Interattive</CardTitle>
                <CardDescription>
                  Crea, modifica e organizza i tuoi appunti con supporto per testo, immagini e allegati.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/note" className="w-full">
                  <Button variant="outline" className="w-full">
                    Apri Note
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <BrainCircuit className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Mappe Mentali</CardTitle>
                <CardDescription>Crea mappe mentali interattive per visualizzare e collegare concetti.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/mappe" className="w-full">
                  <Button variant="outline" className="w-full">
                    Apri Mappe
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <FlaskConical className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Flashcard</CardTitle>
                <CardDescription>Studia con flashcard e ripetizione spaziata per memorizzare meglio.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/flashcard" className="w-full">
                  <Button variant="outline" className="w-full">
                    Apri Flashcard
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Attività</CardTitle>
                <CardDescription>
                  Gestisci compiti, scadenze e utilizza il timer Pomodoro per studiare meglio.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/attivita" className="w-full">
                  <Button variant="outline" className="w-full">
                    Apri Attività
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CalendarDaysIcon className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Calendario</CardTitle>
                <CardDescription>
                  Visualizza e organizza i tuoi eventi e scadenze in un calendario interattivo.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/attivita?tab=calendar" className="w-full">
                  <Button variant="outline" className="w-full">
                    Apri Calendario
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

