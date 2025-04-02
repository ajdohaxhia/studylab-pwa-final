"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Square, Save, Trash2, Volume2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { storeFile } from "@/lib/file-storage"
import { Progress } from "@/components/ui/progress"

interface VoiceRecorderProps {
  onSave: (audioUrl: string) => void
  onCancel: () => void
}

export default function VoiceRecorder({ onSave, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { toast } = useToast()

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }

      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording, audioUrl])

  // Format recording time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Start timer
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      toast({
        title: "Registrazione avviata",
        description: "Parla ora. Premi Stop quando hai finito.",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Errore",
        description: "Impossibile avviare la registrazione. Verifica che il microfono sia accessibile.",
        variant: "destructive",
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      toast({
        title: "Registrazione completata",
        description: `Durata: ${formatTime(recordingTime)}`,
      })
    }
  }

  // Pause/resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current || !isRecording) return

    if (isPaused) {
      // Resume
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      // Pause
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  // Save recording
  const saveRecording = async () => {
    if (!audioUrl) return

    try {
      // Convert blob URL to blob
      const response = await fetch(audioUrl)
      const blob = await response.blob()

      // Create file from blob
      const file = new File([blob], `registrazione_${new Date().toISOString()}.webm`, {
        type: "audio/webm",
      })

      // Store file
      const fileMetadata = await storeFile(file)

      // Call onSave with audio URL
      onSave(fileMetadata.url)

      toast({
        title: "Registrazione salvata",
        description: "La registrazione vocale è stata salvata con successo.",
      })
    } catch (error) {
      console.error("Error saving recording:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare la registrazione. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  // Play/pause audio
  const toggleAudio = () => {
    if (!audioRef.current) return

    if (audioRef.current.paused) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Registrazione Vocale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording timer */}
        {(isRecording || audioUrl) && (
          <div className="text-center">
            {isRecording ? (
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold mb-2">{formatTime(recordingTime)}</div>
                <div className="w-full max-w-xs">
                  <Progress value={100} className="h-2 animate-pulse" />
                </div>
              </div>
            ) : audioUrl ? (
              <div className="flex flex-col items-center">
                <audio ref={audioRef} src={audioUrl} className="w-full max-w-xs mb-2" controls />
                <Button variant="outline" size="sm" onClick={toggleAudio}>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Riproduci
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isRecording && !audioUrl ? (
          <>
            <Button variant="outline" onClick={onCancel}>
              Annulla
            </Button>
            <Button onClick={startRecording}>
              <Mic className="h-4 w-4 mr-2" />
              Inizia Registrazione
            </Button>
          </>
        ) : isRecording ? (
          <>
            <Button variant="outline" onClick={togglePause}>
              {isPaused ? "Riprendi" : "Pausa"}
            </Button>
            <Button variant="destructive" onClick={stopRecording}>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </>
        ) : audioUrl ? (
          <>
            <Button
              variant="destructive"
              onClick={() => {
                setAudioUrl(null)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
            <Button onClick={saveRecording}>
              <Save className="h-4 w-4 mr-2" />
              Salva
            </Button>
          </>
        ) : null}
      </CardFooter>
    </Card>
  )
}

