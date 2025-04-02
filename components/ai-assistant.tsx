"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Brain, Send, Sparkles, ImageIcon, FileText, BookOpen, Lightbulb, Loader2 } from "lucide-react"
import {
  generateText,
  generateImage,
  generateFlashcards,
  summarizeText,
  generateStudyRecommendations,
} from "@/lib/ai-service"
import { add } from "@/lib/db"
import { generateId } from "@/lib/utils"
import { storeFile } from "@/lib/file-storage"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState("chat")
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [textToSummarize, setTextToSummarize] = useState("")
  const [summary, setSummary] = useState("")
  const [flashcardText, setFlashcardText] = useState("")
  const [flashcardCount, setFlashcardCount] = useState(5)
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Array<{ front: string; back: string }>>([])
  const [studyTopic, setStudyTopic] = useState("")
  const [studyRecommendations, setStudyRecommendations] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(512)
  const responseRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of response when it updates
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [response])

  // Handle chat prompt submission
  const handleChatSubmit = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setResponse("")

    try {
      const result = await generateText(prompt, {
        temperature,
        max_tokens: maxTokens,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setResponse(result.text)
    } catch (error) {
      console.error("Errore nella generazione del testo:", error)
      toast({
        title: "Errore",
        description: "Impossibile generare una risposta. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image generation
  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) return

    setIsLoading(true)
    setGeneratedImage(null)

    try {
      const imageUrl = await generateImage(imagePrompt)

      if (!imageUrl) {
        throw new Error("Failed to generate image")
      }

      setGeneratedImage(imageUrl)
    } catch (error) {
      console.error("Errore nella generazione dell'immagine:", error)
      toast({
        title: "Errore",
        description: "Impossibile generare l'immagine. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle text summarization
  const handleSummarize = async () => {
    if (!textToSummarize.trim()) return

    setIsLoading(true)
    setSummary("")

    try {
      const result = await summarizeText(textToSummarize)
      setSummary(result)
    } catch (error) {
      console.error("Errore nella generazione del riassunto:", error)
      toast({
        title: "Errore",
        description: "Impossibile generare il riassunto. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle flashcard generation
  const handleGenerateFlashcards = async () => {
    if (!flashcardText.trim()) return

    setIsLoading(true)
    setGeneratedFlashcards([])

    try {
      const flashcards = await generateFlashcards(flashcardText, flashcardCount)
      setGeneratedFlashcards(flashcards)
    } catch (error) {
      console.error("Errore nella generazione delle flashcard:", error)
      toast({
        title: "Errore",
        description: "Impossibile generare le flashcard. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle study recommendations
  const handleStudyRecommendations = async () => {
    if (!studyTopic.trim()) return

    setIsLoading(true)
    setStudyRecommendations("")

    try {
      const recommendations = await generateStudyRecommendations(studyTopic)
      setStudyRecommendations(recommendations)
    } catch (error) {
      console.error("Errore nella generazione dei consigli di studio:", error)
      toast({
        title: "Errore",
        description: "Impossibile generare i consigli di studio. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save generated flashcards to a deck
  const saveFlashcardsToDeck = async () => {
    if (generatedFlashcards.length === 0) return

    try {
      // Create a new deck
      const deckId = generateId()
      const deckTitle = `Flashcard generate - ${new Date().toLocaleDateString("it-IT")}`

      await add("decks", {
        id: deckId,
        title: deckTitle,
        description: `Flashcard generate automaticamente dal testo: "${flashcardText.substring(0, 50)}..."`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      // Add flashcards to the deck
      for (const card of generatedFlashcards) {
        await add("flashcards", {
          id: generateId(),
          deckId,
          front: card.front,
          back: card.back,
          reviewData: {
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            dueDate: Date.now(),
            lastReview: 0,
          },
          createdAt: Date.now(),
        })
      }

      toast({
        title: "Flashcard salvate",
        description: `${generatedFlashcards.length} flashcard sono state salvate nel mazzo "${deckTitle}".`,
      })
    } catch (error) {
      console.error("Errore nel salvataggio delle flashcard:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le flashcard. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  // Save generated image
  const saveGeneratedImage = async () => {
    if (!generatedImage) return

    try {
      // Convert data URL to blob
      const response = await fetch(generatedImage)
      const blob = await response.blob()

      // Create file from blob
      const file = new File([blob], `ai-image-${Date.now()}.png`, { type: "image/png" })

      // Store file
      const fileMetadata = await storeFile(file)

      toast({
        title: "Immagine salvata",
        description: "L'immagine generata è stata salvata con successo.",
      })
    } catch (error) {
      console.error("Errore nel salvataggio dell'immagine:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare l'immagine. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  // Save generated note
  const saveGeneratedNote = async (title: string, content: string) => {
    if (!content) return

    try {
      await add("notes", {
        id: generateId(),
        title,
        content,
        tags: [],
        media: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      toast({
        title: "Nota salvata",
        description: "La nota è stata salvata con successo.",
      })
    } catch (error) {
      console.error("Errore nel salvataggio della nota:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare la nota. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="chat" className="flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Assistente</span>
            <span className="inline md:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center">
            <ImageIcon className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Generatore Immagini</span>
            <span className="inline md:hidden">Immagini</span>
          </TabsTrigger>
          <TabsTrigger value="summarize" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Riassunto</span>
            <span className="inline md:hidden">Riassunto</span>
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Generatore Flashcard</span>
            <span className="inline md:hidden">Flashcard</span>
          </TabsTrigger>
          <TabsTrigger value="study" className="flex items-center">
            <Lightbulb className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Consigli di Studio</span>
            <span className="inline md:hidden">Consigli</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assistente AI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Fai una domanda all'assistente AI..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        e.preventDefault()
                        handleChatSubmit()
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Premi Ctrl+Enter per inviare</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="temperature">Temperatura: {temperature.toFixed(1)}</Label>
                  </div>
                  <Slider
                    id="temperature"
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={(value) => setTemperature(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valori più bassi = risposte più prevedibili, valori più alti = risposte più creative
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="max-tokens">Lunghezza massima: {maxTokens}</Label>
                  </div>
                  <Slider
                    id="max-tokens"
                    min={64}
                    max={1024}
                    step={64}
                    value={[maxTokens]}
                    onValueChange={(value) => setMaxTokens(value[0])}
                  />
                </div>

                {response && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div ref={responseRef} className="whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                        {response}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" onClick={() => saveGeneratedNote("Risposta AI", response)}>
                        Salva come Nota
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleChatSubmit} disabled={isLoading || !prompt.trim()} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Invia
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generatore di Immagini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Descrivi l'immagine che vuoi generare..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esempio: "Un paesaggio montano con un lago cristallino, stile acquerello"
                  </p>
                </div>

                {isLoading && !generatedImage && (
                  <div className="space-y-2 py-4">
                    <p className="text-sm text-center">Generazione dell'immagine in corso...</p>
                    <Progress className="w-full" value={undefined} />
                  </div>
                )}

                {generatedImage && (
                  <div className="mt-4">
                    <div className="border rounded-md overflow-hidden">
                      <img
                        src={generatedImage || "/placeholder.svg"}
                        alt="Immagine generata"
                        className="w-full h-auto"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={saveGeneratedImage}>
                      Salva Immagine
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleImageGeneration} disabled={isLoading || !imagePrompt.trim()} className="w-full">
                {isLoading && !generatedImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Genera Immagine
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="summarize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riassunto Automatico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Incolla il testo da riassumere..."
                    value={textToSummarize}
                    onChange={(e) => setTextToSummarize(e.target.value)}
                    rows={6}
                  />
                </div>

                {isLoading && !summary && (
                  <div className="space-y-2 py-4">
                    <p className="text-sm text-center">Generazione del riassunto in corso...</p>
                    <Progress className="w-full" value={undefined} />
                  </div>
                )}

                {summary && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">Riassunto:</h3>
                      <div className="whitespace-pre-wrap">{summary}</div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" onClick={() => saveGeneratedNote("Riassunto", summary)}>
                        Salva come Nota
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSummarize} disabled={isLoading || !textToSummarize.trim()} className="w-full">
                {isLoading && !summary ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Genera Riassunto
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generatore di Flashcard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Incolla il testo da cui generare le flashcard..."
                    value={flashcardText}
                    onChange={(e) => setFlashcardText(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flashcard-count">Numero di flashcard: {flashcardCount}</Label>
                  <Slider
                    id="flashcard-count"
                    min={3}
                    max={15}
                    step={1}
                    value={[flashcardCount]}
                    onValueChange={(value) => setFlashcardCount(value[0])}
                  />
                </div>

                {isLoading && generatedFlashcards.length === 0 && (
                  <div className="space-y-2 py-4">
                    <p className="text-sm text-center">Generazione delle flashcard in corso...</p>
                    <Progress className="w-full" value={undefined} />
                  </div>
                )}

                {generatedFlashcards.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Flashcard generate:</h3>
                    <div className="space-y-2">
                      {generatedFlashcards.map((card, index) => (
                        <Card key={index} className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="font-medium">Fronte:</div>
                            <div className="mb-2">{card.front}</div>
                            <div className="font-medium">Retro:</div>
                            <div>{card.back}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button onClick={saveFlashcardsToDeck}>Salva come Mazzo di Flashcard</Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateFlashcards}
                disabled={isLoading || !flashcardText.trim()}
                className="w-full"
              >
                {isLoading && generatedFlashcards.length === 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Genera Flashcard
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="study" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consigli di Studio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Inserisci l'argomento di studio..."
                    value={studyTopic}
                    onChange={(e) => setStudyTopic(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esempio: "Equazioni differenziali", "Storia romana", "Programmazione orientata agli oggetti"
                  </p>
                </div>

                {isLoading && !studyRecommendations && (
                  <div className="space-y-2 py-4">
                    <p className="text-sm text-center">Generazione dei consigli in corso...</p>
                    <Progress className="w-full" value={undefined} />
                  </div>
                )}

                {studyRecommendations && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">Consigli di studio per: {studyTopic}</h3>
                      <div className="whitespace-pre-wrap">{studyRecommendations}</div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveGeneratedNote(`Consigli di studio: ${studyTopic}`, studyRecommendations)}
                      >
                        Salva come Nota
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleStudyRecommendations}
                disabled={isLoading || !studyTopic.trim()}
                className="w-full"
              >
                {isLoading && !studyRecommendations ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Genera Consigli
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

