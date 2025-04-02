"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { get, put, add, remove, getAllFromIndex } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { generateId } from "@/lib/utils"
import { createDefaultReviewData, isDue, sortByDueDate } from "@/lib/spaced-repetition"
import { storeFile } from "@/lib/file-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import FlashcardStudy from "@/components/flashcard-study"

interface Deck {
  id: string
  title: string
  description: string
  createdAt: number
  updatedAt: number
}

interface Flashcard {
  id: string
  deckId: string
  front: string
  back: string
  reviewData: {
    easeFactor: number
    interval: number
    repetitions: number
    dueDate: number
    lastReview: number
  }
  createdAt: number
}

export default function DeckDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")

  // New flashcard state
  const [newFront, setNewFront] = useState("")
  const [newBack, setNewBack] = useState("")

  const deckId = params.id as string

  useEffect(() => {
    loadDeck()
    loadFlashcards()
  }, [deckId])

  // Update due cards when flashcards change
  useEffect(() => {
    const due = flashcards.filter((card) => isDue(card.reviewData))
    setDueCards(sortByDueDate(due))
  }, [flashcards])

  async function loadDeck() {
    setIsLoading(true)
    try {
      const deckData = await get<"decks">("decks", deckId)
      if (deckData) {
        setDeck(deckData)
        setTitle(deckData.title)
        setDescription(deckData.description)
      } else {
        toast({
          title: "Mazzo non trovato",
          description: "Il mazzo richiesto non esiste o è stato eliminato.",
          variant: "destructive",
        })
        router.push("/flashcard")
      }
    } catch (error) {
      console.error("Errore nel caricamento del mazzo:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare il mazzo. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function loadFlashcards() {
    try {
      const flashcardsData = await getAllFromIndex<"flashcards">("flashcards", "by-deck", deckId)
      setFlashcards(flashcardsData)
    } catch (error) {
      console.error("Errore nel caricamento delle flashcard:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare le flashcard. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function saveDeck() {
    if (!deck) return

    setIsSaving(true)
    try {
      const updatedDeck = {
        ...deck,
        title,
        description,
        updatedAt: Date.now(),
      }

      await put("decks", updatedDeck)
      setDeck(updatedDeck)
      toast({
        title: "Mazzo salvato",
        description: "Le modifiche sono state salvate con successo.",
      })
    } catch (error) {
      console.error("Errore nel salvataggio del mazzo:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function addFlashcard() {
    if (!newFront || !newBack) {
      toast({
        title: "Campi mancanti",
        description: "Compila entrambi i lati della flashcard.",
        variant: "destructive",
      })
      return
    }

    const newFlashcard: Flashcard = {
      id: generateId(),
      deckId,
      front: newFront,
      back: newBack,
      reviewData: createDefaultReviewData(),
      createdAt: Date.now(),
    }

    try {
      await add("flashcards", newFlashcard)
      setNewFront("")
      setNewBack("")
      loadFlashcards()
      toast({
        title: "Flashcard aggiunta",
        description: "La flashcard è stata aggiunta con successo.",
      })
    } catch (error) {
      console.error("Errore nell'aggiunta della flashcard:", error)
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la flashcard. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function deleteFlashcard(id: string) {
    try {
      await remove("flashcards", id)
      loadFlashcards()
      toast({
        title: "Flashcard eliminata",
        description: "La flashcard è stata eliminata con successo.",
      })
    } catch (error) {
      console.error("Errore nell'eliminazione della flashcard:", error)
      toast({
        title: "Errore",
        description: "Impossibile eliminare la flashcard. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  function startStudy() {
    if (dueCards.length === 0) {
      toast({
        title: "Nessuna flashcard da studiare",
        description: "Non ci sono flashcard pronte per essere studiate in questo momento.",
        variant: "destructive",
      })
      return
    }

    setActiveTab("study")
  }

  function handleStudyComplete() {
    toast({
      title: "Studio completato",
      description: "Hai completato tutte le flashcard in questo mazzo.",
    })
    loadFlashcards()
    setActiveTab("edit")
  }

  function handleCardUpdate(updatedCard: Flashcard) {
    setFlashcards((cards) => cards.map((card) => (card.id === updatedCard.id ? updatedCard : card)))
  }

  async function handleImageUpload(file: File): Promise<string> {
    try {
      const fileMetadata = await storeFile(file)
      return fileMetadata.url
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error)
      throw error
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Caricamento...</div>
  }

  if (!deck) {
    return <div className="flex justify-center items-center h-64">Mazzo non trovato</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/flashcard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="ml-auto">
          <Button onClick={saveDeck} disabled={isSaving}>
            {isSaving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Modifica</TabsTrigger>
          <TabsTrigger value="study" disabled={dueCards.length === 0}>
            Studia ({dueCards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Mazzo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titolo del mazzo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrizione del mazzo"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aggiungi Flashcard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="front">Fronte</Label>
                <Textarea
                  id="front"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Domanda o concetto"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="back">Retro</Label>
                <Textarea
                  id="back"
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Risposta o definizione"
                  rows={3}
                />
              </div>
              <Button onClick={addFlashcard}>Aggiungi Flashcard</Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Flashcard ({flashcards.length})</h2>
            {flashcards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Non ci sono flashcard in questo mazzo. Aggiungine una!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards.map((card) => (
                  <Card key={card.id}>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <h3 className="font-medium">Fronte:</h3>
                        <div className="mt-1" dangerouslySetInnerHTML={{ __html: card.front }} />
                      </div>
                      <div>
                        <h3 className="font-medium">Retro:</h3>
                        <div className="mt-1" dangerouslySetInnerHTML={{ __html: card.back }} />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="destructive" size="sm" onClick={() => deleteFlashcard(card.id)}>
                          Elimina
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="study">
          <FlashcardStudy cards={dueCards} onComplete={handleStudyComplete} onUpdateCard={handleCardUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

