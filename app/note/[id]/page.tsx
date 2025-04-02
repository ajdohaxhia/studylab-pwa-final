"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Plus, Download, Mic, FileDown } from "lucide-react"
import { get, put } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { debounce } from "@/lib/utils"
import RichTextEditor from "@/components/rich-text-editor"
import { storeFile } from "@/lib/file-storage"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportAsPdf, exportAsPng } from "@/lib/export-utils"
import VoiceRecorder from "@/components/voice-recorder"

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  media: {
    id: string
    type: string
    url: string
  }[]
  createdAt: number
  updatedAt: number
}

export default function NoteDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [note, setNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false)
  const noteContentRef = useRef<HTMLDivElement>(null)

  const noteId = params.id as string

  useEffect(() => {
    loadNote()
  }, [noteId])

  async function loadNote() {
    setIsLoading(true)
    try {
      const noteData = await get<"notes">("notes", noteId)
      if (noteData) {
        setNote(noteData)
      } else {
        toast({
          title: "Nota non trovata",
          description: "La nota richiesta non esiste o è stata eliminata.",
          variant: "destructive",
        })
        router.push("/note")
      }
    } catch (error) {
      console.error("Errore nel caricamento della nota:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare la nota. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveNote = debounce(async () => {
    if (!note) return

    setIsSaving(true)
    try {
      const updatedNote = {
        ...note,
        updatedAt: Date.now(),
      }

      await put("notes", updatedNote)
      setNote(updatedNote)
      toast({
        title: "Nota salvata",
        description: "Le modifiche sono state salvate con successo.",
      })
    } catch (error) {
      console.error("Errore nel salvataggio della nota:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, 1000)

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!note) return
    setNote({
      ...note,
      title: e.target.value,
    })
    saveNote()
  }

  function handleContentChange(content: string) {
    if (!note) return
    setNote({
      ...note,
      content,
    })
    saveNote()
  }

  async function handleImageUpload(file: File): Promise<string> {
    try {
      const fileMetadata = await storeFile(file)

      // Add to note's media
      if (note) {
        setNote({
          ...note,
          media: [
            ...note.media,
            {
              id: fileMetadata.id,
              type: "image",
              url: fileMetadata.url,
            },
          ],
        })
      }

      return fileMetadata.url
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error)
      throw error
    }
  }

  async function handleAudioUpload(file: File): Promise<string> {
    try {
      const fileMetadata = await storeFile(file)

      // Add to note's media
      if (note) {
        setNote({
          ...note,
          media: [
            ...note.media,
            {
              id: fileMetadata.id,
              type: "audio",
              url: fileMetadata.url,
            },
          ],
        })
      }

      return fileMetadata.url
    } catch (error) {
      console.error("Errore nel caricamento dell'audio:", error)
      throw error
    }
  }

  async function handleFileUpload(file: File): Promise<string> {
    try {
      const fileMetadata = await storeFile(file)

      // Add to note's media
      if (note) {
        setNote({
          ...note,
          media: [
            ...note.media,
            {
              id: fileMetadata.id,
              type: "file",
              url: fileMetadata.url,
            },
          ],
        })
      }

      return fileMetadata.url
    } catch (error) {
      console.error("Errore nel caricamento del file:", error)
      throw error
    }
  }

  function addTag() {
    if (!note || !newTag.trim()) return

    // Don't add duplicate tags
    if (note.tags.includes(newTag.trim())) {
      toast({
        title: "Tag duplicato",
        description: "Questo tag è già presente nella nota.",
        variant: "destructive",
      })
      return
    }

    const updatedNote = {
      ...note,
      tags: [...note.tags, newTag.trim()],
    }

    setNote(updatedNote)
    setNewTag("")
    setIsTagDialogOpen(false)
    saveNote()
  }

  function removeTag(tagToRemove: string) {
    if (!note) return

    const updatedNote = {
      ...note,
      tags: note.tags.filter((tag) => tag !== tagToRemove),
    }

    setNote(updatedNote)
    saveNote()
  }

  async function exportNote(format: "pdf" | "png") {
    if (!note) return

    try {
      // Create a temporary div with note content
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="font-size: 24px; margin-bottom: 10px;">${note.title}</h1>
          <div style="margin-bottom: 20px;">
            ${note.tags.map((tag) => `<span style="display: inline-block; background-color: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 4px; margin-right: 5px;">${tag}</span>`).join("")}
          </div>
          <div>${note.content}</div>
        </div>
      `
      tempDiv.id = "note-export-content"
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      document.body.appendChild(tempDiv)

      // Export based on format
      if (format === "pdf") {
        await exportAsPdf("note-export-content", `nota_${note.title.replace(/\s+/g, "_")}`)
      } else {
        await exportAsPng("note-export-content", `nota_${note.title.replace(/\s+/g, "_")}`)
      }

      // Remove temporary div
      document.body.removeChild(tempDiv)

      toast({
        title: "Esportazione completata",
        description: `La nota è stata esportata in formato ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error(`Errore nell'esportazione della nota come ${format}:`, error)
      toast({
        title: "Errore",
        description: `Impossibile esportare la nota come ${format.toUpperCase()}. Riprova più tardi.`,
        variant: "destructive",
      })
    }
  }

  function handleVoiceRecordingSave(audioUrl: string) {
    if (!note) return

    // Add audio to note
    let updatedContent = note.content

    // Create audio player HTML
    const audioHtml = `
      <div class="audio-player" style="margin: 10px 0;">
        <audio controls src="${audioUrl}"></audio>
        <div class="audio-caption" style="font-size: 0.8rem; color: #666;">
          Registrazione vocale (${new Date().toLocaleTimeString()})
        </div>
      </div>
    `

    updatedContent += audioHtml

    // Update note
    setNote({
      ...note,
      content: updatedContent,
      media: [
        ...note.media,
        {
          id: generateId(),
          type: "audio",
          url: audioUrl,
        },
      ],
    })

    // Close dialog and save
    setIsVoiceRecorderOpen(false)
    saveNote()
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Caricamento...</div>
  }

  if (!note) {
    return <div className="flex justify-center items-center h-64">Nota non trovata</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/note")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        <h1 className="text-2xl font-bold">Editor Note</h1>
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={isVoiceRecorderOpen} onOpenChange={setIsVoiceRecorderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mic className="mr-2 h-4 w-4" />
                Registra Audio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrazione Vocale</DialogTitle>
              </DialogHeader>
              <VoiceRecorder onSave={handleVoiceRecordingSave} onCancel={() => setIsVoiceRecorderOpen(false)} />
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Esporta
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="animate-scale-in">
              <DropdownMenuItem onClick={() => exportNote("pdf")}>
                <Download className="mr-2 h-4 w-4" />
                Esporta come PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportNote("png")}>
                <Download className="mr-2 h-4 w-4" />
                Esporta come PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => saveNote()} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            value={note.title}
            onChange={handleTitleChange}
            placeholder="Titolo della nota"
            className="text-xl font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Tag:</span>
          {note.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => removeTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}

          <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7">
                <Plus className="h-3.5 w-3.5 mr-1" /> Aggiungi Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tag">Nome del tag</Label>
                  <Input
                    id="tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Inserisci un nuovo tag"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                </div>
                <Button onClick={addTag}>Aggiungi</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div ref={noteContentRef}>
          <RichTextEditor
            value={note.content}
            onChange={handleContentChange}
            onImageUpload={handleImageUpload}
            onAudioUpload={handleAudioUpload}
            onFileUpload={handleFileUpload}
          />
        </div>
      </div>
    </div>
  )
}

import { generateId } from "@/lib/utils"

