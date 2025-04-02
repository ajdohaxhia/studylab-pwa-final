"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  ImageIcon,
  FileAudio,
  Paperclip,
  Mic,
  Camera,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LinkIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { readFileAsDataURL, formatFileSize } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  onAudioUpload?: (file: File) => Promise<string>
  onFileUpload?: (file: File) => Promise<string>
}

export default function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  onAudioUpload,
  onFileUpload,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const { toast } = useToast()

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || ""
    }
  }, [])

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Execute command on editor
  const execCommand = (command: string, value = "") => {
    document.execCommand(command, false, value)
    handleContentChange()
    editorRef.current?.focus()
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Errore",
        description: "Il file selezionato non è un'immagine.",
        variant: "destructive",
      })
      return
    }

    try {
      let imageUrl = ""

      if (onImageUpload) {
        // Use provided upload handler
        imageUrl = await onImageUpload(file)
      } else {
        // Fallback to local data URL
        imageUrl = await readFileAsDataURL(file)
      }

      // Insert image at cursor position
      execCommand("insertHTML", `<img src="${imageUrl}" alt="Immagine" style="max-width: 100%; margin: 10px 0;" />`)

      toast({
        title: "Immagine caricata",
        description: "L'immagine è stata inserita con successo.",
      })
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare l'immagine. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  // Handle audio upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Errore",
        description: "Il file selezionato non è un file audio.",
        variant: "destructive",
      })
      return
    }

    try {
      let audioUrl = ""

      if (onAudioUpload) {
        // Use provided upload handler
        audioUrl = await onAudioUpload(file)
      } else {
        // Fallback to local data URL
        audioUrl = await readFileAsDataURL(file)
      }

      // Insert audio player at cursor position
      execCommand(
        "insertHTML",
        `
        <div class="audio-player" style="margin: 10px 0;">
          <audio controls src="${audioUrl}"></audio>
          <div class="audio-caption" style="font-size: 0.8rem; color: #666;">
            ${file.name} (${formatFileSize(file.size)})
          </div>
        </div>
      `,
      )

      toast({
        title: "Audio caricato",
        description: "Il file audio è stato inserito con successo.",
      })
    } catch (error) {
      console.error("Errore nel caricamento dell'audio:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare il file audio. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  // Handle file attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]

    try {
      let fileUrl = ""
      const fileName = file.name

      if (onFileUpload) {
        // Use provided upload handler
        fileUrl = await onFileUpload(file)
      } else {
        // Fallback to local data URL (not ideal for large files)
        fileUrl = await readFileAsDataURL(file)
      }

      // Insert file attachment at cursor position
      execCommand(
        "insertHTML",
        `
        <div class="file-attachment" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center;">
          <div style="margin-right: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <div style="font-weight: 500;">${fileName}</div>
            <div style="font-size: 0.8rem; color: #666;">${formatFileSize(file.size)}</div>
          </div>
          <a href="${fileUrl}" download="${fileName}" style="margin-left: auto; color: #3b82f6; text-decoration: none;">Scarica</a>
        </div>
      `,
      )

      toast({
        title: "File allegato",
        description: "Il file è stato allegato con successo.",
      })
    } catch (error) {
      console.error("Errore nell'allegare il file:", error)
      toast({
        title: "Errore",
        description: "Impossibile allegare il file. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordedChunks([])

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data])
        }
      }

      recorder.onstop = async () => {
        // Create blob from recorded chunks
        const audioBlob = new Blob(recordedChunks, { type: "audio/webm" })

        try {
          let audioUrl = ""

          if (onAudioUpload) {
            // Convert blob to file
            const audioFile = new File([audioBlob], "registrazione.webm", { type: "audio/webm" })
            audioUrl = await onAudioUpload(audioFile)
          } else {
            // Fallback to local data URL
            audioUrl = URL.createObjectURL(audioBlob)
          }

          // Insert audio player at cursor position
          execCommand(
            "insertHTML",
            `
            <div class="audio-player" style="margin: 10px 0;">
              <audio controls src="${audioUrl}"></audio>
              <div class="audio-caption" style="font-size: 0.8rem; color: #666;">
                Registrazione vocale (${new Date().toLocaleTimeString()})
              </div>
            </div>
          `,
          )

          toast({
            title: "Registrazione completata",
            description: "La registrazione vocale è stata inserita con successo.",
          })
        } catch (error) {
          console.error("Errore nel salvare la registrazione:", error)
          toast({
            title: "Errore",
            description: "Impossibile salvare la registrazione. Riprova più tardi.",
            variant: "destructive",
          })
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()

      toast({
        title: "Registrazione avviata",
        description: "Parla ora. Premi Stop quando hai finito.",
      })
    } catch (error) {
      console.error("Errore nell'avvio della registrazione:", error)
      toast({
        title: "Errore",
        description: "Impossibile avviare la registrazione. Verifica che il microfono sia accessibile.",
        variant: "destructive",
      })
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  // Insert link
  const insertLink = (url: string, text: string) => {
    if (!url) return

    const linkText = text || url
    execCommand("insertHTML", `<a href="${url}" target="_blank">${linkText}</a>`)
  }

  return (
    <div className="border rounded-md">
      <div className="bg-muted p-2 flex flex-wrap gap-1 items-center border-b">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("bold")}>
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grassetto</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("italic")}>
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Corsivo</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("insertUnorderedList")}>
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Elenco puntato</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("insertOrderedList")}>
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Elenco numerato</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("justifyLeft")}>
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Allinea a sinistra</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("justifyCenter")}>
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Centra</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("justifyRight")}>
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Allinea a destra</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("undo")}>
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Annulla</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("redo")}>
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ripeti</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Inserisci link</h4>
                  <p className="text-sm text-muted-foreground">Inserisci l'URL e il testo del link</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" placeholder="https://esempio.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="text">Testo</Label>
                  <Input id="text" placeholder="Testo del link" />
                </div>
                <Button
                  onClick={() => {
                    const url = (document.getElementById("url") as HTMLInputElement).value
                    const text = (document.getElementById("text") as HTMLInputElement).value
                    insertLink(url, text)
                  }}
                >
                  Inserisci
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <ImageIcon className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>Inserisci immagine</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <FileAudio className="h-4 w-4" />
                  <input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleAudioUpload}
                  />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>Inserisci audio</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>Allega file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRecording ? "Ferma registrazione" : "Registra audio"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>Scatta foto</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        ref={editorRef}
        className="min-h-[200px] p-4 focus:outline-none"
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}

