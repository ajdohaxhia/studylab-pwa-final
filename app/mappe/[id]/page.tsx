"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Download, FileDown } from "lucide-react"
import { get, put } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { debounce } from "@/lib/utils"
import MindMapEditor from "@/components/mind-map-editor"
import type { Node, Edge } from "reactflow"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportAsPdf, exportAsPng, exportAsJson } from "@/lib/export-utils"

interface MindMap {
  id: string
  title: string
  nodes: Node[]
  edges: Edge[]
  createdAt: number
  updatedAt: number
}

export default function MindMapDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [mindmap, setMindmap] = useState<MindMap | null>(null)
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const mindmapRef = useRef<HTMLDivElement>(null)

  const mindmapId = params.id as string

  useEffect(() => {
    loadMindMap()
  }, [mindmapId])

  async function loadMindMap() {
    setIsLoading(true)
    try {
      const mindmapData = await get<"mindmaps">("mindmaps", mindmapId)
      if (mindmapData) {
        setMindmap(mindmapData)
        setTitle(mindmapData.title)
      } else {
        toast({
          title: "Mappa mentale non trovata",
          description: "La mappa mentale richiesta non esiste o è stata eliminata.",
          variant: "destructive",
        })
        router.push("/mappe")
      }
    } catch (error) {
      console.error("Errore nel caricamento della mappa mentale:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare la mappa mentale. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveMindMap = debounce(async () => {
    if (!mindmap) return

    setIsSaving(true)
    try {
      const updatedMindMap = {
        ...mindmap,
        title,
        updatedAt: Date.now(),
      }

      await put("mindmaps", updatedMindMap)
      setMindmap(updatedMindMap)
      toast({
        title: "Mappa mentale salvata",
        description: "Le modifiche sono state salvate con successo.",
      })
    } catch (error) {
      console.error("Errore nel salvataggio della mappa mentale:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, 1000)

  function handleMindMapChange(nodes: Node[], edges: Edge[]) {
    if (!mindmap) return

    setMindmap({
      ...mindmap,
      nodes,
      edges,
    })

    // Auto-save changes
    saveMindMap()
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value)
    saveMindMap()
  }

  async function exportMindMap(format: "pdf" | "png" | "json") {
    if (!mindmap) return

    try {
      if (format === "json") {
        // Export as JSON
        exportAsJson(
          {
            title: mindmap.title,
            nodes: mindmap.nodes,
            edges: mindmap.edges,
            exportDate: new Date().toISOString(),
          },
          `mappa_${mindmap.title.replace(/\s+/g, "_")}`,
        )
      } else {
        // Export as PDF or PNG
        if (!mindmapRef.current) {
          toast({
            title: "Errore",
            description: "Impossibile esportare la mappa mentale. Elemento non trovato.",
            variant: "destructive",
          })
          return
        }

        if (format === "pdf") {
          await exportAsPdf("reactflow-wrapper", `mappa_${mindmap.title.replace(/\s+/g, "_")}`)
        } else {
          await exportAsPng("reactflow-wrapper", `mappa_${mindmap.title.replace(/\s+/g, "_")}`)
        }
      }

      toast({
        title: "Esportazione completata",
        description: `La mappa mentale è stata esportata in formato ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error(`Errore nell'esportazione della mappa mentale come ${format}:`, error)
      toast({
        title: "Errore",
        description: `Impossibile esportare la mappa mentale come ${format.toUpperCase()}. Riprova più tardi.`,
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Caricamento...</div>
  }

  if (!mindmap) {
    return <div className="flex justify-center items-center h-64">Mappa mentale non trovata</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/mappe")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Titolo della mappa mentale"
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Esporta
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="animate-scale-in">
              <DropdownMenuItem onClick={() => exportMindMap("pdf")}>
                <Download className="mr-2 h-4 w-4" />
                Esporta come PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMindMap("png")}>
                <Download className="mr-2 h-4 w-4" />
                Esporta come PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMindMap("json")}>
                <Download className="mr-2 h-4 w-4" />
                Esporta come JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => saveMindMap()} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      <div ref={mindmapRef} id="reactflow-wrapper">
        <MindMapEditor initialNodes={mindmap.nodes} initialEdges={mindmap.edges} onChange={handleMindMapChange} />
      </div>
    </div>
  )
}

