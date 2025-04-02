"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { calculateNextReview, type ReviewData, formatDueDate } from "@/lib/spaced-repetition"
import { put } from "@/lib/db"
import confetti from "canvas-confetti"

interface Flashcard {
  id: string
  deckId: string
  front: string
  back: string
  reviewData: ReviewData
  createdAt: number
}

interface FlashcardStudyProps {
  cards: Flashcard[]
  onComplete: () => void
  onUpdateCard: (updatedCard: Flashcard) => void
}

export default function FlashcardStudy({ cards, onComplete, onUpdateCard }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState(0)
  const [studiedCards, setStudiedCards] = useState<string[]>([])
  const { toast } = useToast()

  // Calculate progress
  useEffect(() => {
    if (cards.length === 0) return
    setProgress((studiedCards.length / cards.length) * 100)
  }, [studiedCards, cards.length])

  // Check if study session is complete
  useEffect(() => {
    if (cards.length > 0 && studiedCards.length === cards.length) {
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Show completion message
      toast({
        title: "Studio completato!",
        description: `Hai studiato tutte le ${cards.length} flashcard in questo mazzo.`,
      })

      // Notify parent component
      onComplete()
    }
  }, [studiedCards, cards.length, onComplete, toast])

  // Handle card rating
  const rateCard = async (quality: number) => {
    if (currentIndex >= cards.length) return

    const currentCard = cards[currentIndex]

    // Calculate next review data
    const newReviewData = calculateNextReview(currentCard.reviewData, quality)

    // Update card
    const updatedCard = {
      ...currentCard,
      reviewData: newReviewData,
    }

    try {
      // Save to database
      await put("flashcards", updatedCard)

      // Notify parent component
      onUpdateCard(updatedCard)

      // Add to studied cards
      setStudiedCards((prev) => [...prev, currentCard.id])

      // Show feedback based on quality
      if (quality >= 4) {
        toast({
          title: "Ottimo!",
          description: `Prossima ripetizione: ${formatDueDate(newReviewData)}`,
        })
      } else if (quality >= 2) {
        toast({
          title: "Buono",
          description: `Prossima ripetizione: ${formatDueDate(newReviewData)}`,
        })
      } else {
        toast({
          title: "Da rivedere",
          description: "Questa carta verrà ripetuta presto.",
        })
      }

      // Move to next card or complete
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsFlipped(false)
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento della flashcard:", error)
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la flashcard. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  // If no cards, show message
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nessuna flashcard disponibile per lo studio.</p>
      </div>
    )
  }

  // Get current card
  const currentCard = cards[currentIndex]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Carta {currentIndex + 1} di {cards.length}
        </div>
        <div className="text-sm text-muted-foreground">Completato: {Math.round(progress)}%</div>
      </div>

      <Progress value={progress} className="h-2" />

      <div
        className="w-full max-w-md h-64 mx-auto cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}
        >
          <div className="absolute w-full h-full backface-hidden bg-card border rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Fronte</p>
              <div className="text-xl" dangerouslySetInnerHTML={{ __html: currentCard.front }} />
            </div>
          </div>
          <div className="absolute w-full h-full backface-hidden bg-card border rounded-lg p-6 flex items-center justify-center rotate-y-180">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Retro</p>
              <div className="text-xl" dangerouslySetInnerHTML={{ __html: currentCard.back }} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-muted-foreground">Clicca sulla carta per girarla</p>

      {isFlipped && (
        <div className="flex flex-col gap-4 items-center">
          <p className="font-medium">Quanto bene conoscevi questa risposta?</p>
          <div className="grid grid-cols-3 gap-2 w-full max-w-md">
            <Button variant="outline" onClick={() => rateCard(1)}>
              Non la sapevo
            </Button>
            <Button variant="outline" onClick={() => rateCard(3)}>
              Con difficoltà
            </Button>
            <Button variant="outline" onClick={() => rateCard(5)}>
              Perfettamente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

