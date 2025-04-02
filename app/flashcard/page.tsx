"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2 } from "lucide-react"
import { getAll, add, remove } from "@/lib/db"
import { generateId, formatDateTime } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { incrementAchievementProgress } from "@/lib/achievement-service"

interface Deck {
  id: string
  title: string
  description: string
  createdAt: number
  updatedAt: number
}

export default function FlashcardPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadDecks()
  }, [])

  async function loadDecks() {
    try {
      const allDecks = await getAll<"decks">("decks")
      setDecks(allDecks.sort((a, b) => b.updatedAt - a.updatedAt))
    } catch (error) {
      console.error("Errore nel caricamento dei mazzi:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare i mazzi. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function createNewDeck() {
    const newDeck: Deck = {
      id: generateId(),
      title: "Nuovo Mazzo",
      description: "Descrizione del mazzo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      await add("decks", newDeck)

      // Update achievements
      if (decks.length === 0) {
        // First flashcard deck achievement
        await incrementAchievementProgress("first-flashcard-deck", 1)
      }

      toast({
        title: "Mazzo creato",
        description: "Il nuovo mazzo è stato creato con successo.",
      })
      loadDecks()
    } catch (error) {
      console.error("Errore nella creazione del mazzo:", error)
      toast({
        title: "Errore",
        description: "Impossibile creare il mazzo. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function deleteDeck(id: string) {
    try {
      await remove("decks", id)
      toast({
        title: "Mazzo eliminato",
        description: "Il mazzo è stato eliminato con successo.",
      })
      loadDecks()
    } catch (error) {
      console.error("Errore nell'eliminazione del mazzo:", error)
      toast({
        title: "Errore",
        description: "Impossibile eliminare il mazzo. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  const filteredDecks = decks.filter(
    (deck) =>
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">I Miei Mazzi di Flashcard</h1>
        <Button onClick={createNewDeck}>
          <Plus className="mr-2 h-4 w-4" /> Nuovo Mazzo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cerca nei mazzi..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredDecks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? "Nessun mazzo trovato con questa ricerca." : "Non hai ancora creato mazzi. Inizia ora!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <Card key={deck.id}>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{deck.title}</CardTitle>
                <CardDescription>{formatDateTime(deck.updatedAt)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{deck.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/flashcard/${deck.id}`}>
                  <Button variant="outline">Apri</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => deleteDeck(deck.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

