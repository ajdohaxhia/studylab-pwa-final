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

interface MindMap {
  id: string
  title: string
  nodes: any[]
  edges: any[]
  createdAt: number
  updatedAt: number
}

export default function MindMapPage() {
  const [mindmaps, setMindmaps] = useState<MindMap[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadMindMaps()
  }, [])

  async function loadMindMaps() {
    try {
      const allMindMaps = await getAll<"mindmaps">("mindmaps")
      setMindmaps(allMindMaps.sort((a, b) => b.updatedAt - a.updatedAt))
    } catch (error) {
      console.error("Errore nel caricamento delle mappe mentali:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare le mappe mentali. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function createNewMindMap() {
    const newMindMap: MindMap = {
      id: generateId(),
      title: "Nuova Mappa Mentale",
      nodes: [
        {
          id: "node-1",
          type: "textNode",
          data: { label: "Concetto Principale", style: "primary" },
          position: { x: 250, y: 100 },
        },
      ],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      await add("mindmaps", newMindMap)

      // Update achievements
      if (mindmaps.length === 0) {
        // First mindmap achievement
        await incrementAchievementProgress("first-mindmap", 1)
      }

      toast({
        title: "Mappa mentale creata",
        description: "La nuova mappa mentale è stata creata con successo.",
      })
      loadMindMaps()
    } catch (error) {
      console.error("Errore nella creazione della mappa mentale:", error)
      toast({
        title: "Errore",
        description: "Impossibile creare la mappa mentale. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function deleteMindMap(id: string) {
    try {
      await remove("mindmaps", id)
      toast({
        title: "Mappa mentale eliminata",
        description: "La mappa mentale è stata eliminata con successo.",
      })
      loadMindMaps()
    } catch (error) {
      console.error("Errore nell'eliminazione della mappa mentale:", error)
      toast({
        title: "Errore",
        description: "Impossibile eliminare la mappa mentale. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  const filteredMindMaps = mindmaps.filter((mindmap) => mindmap.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Le Mie Mappe Mentali</h1>
        <Button onClick={createNewMindMap}>
          <Plus className="mr-2 h-4 w-4" /> Nuova Mappa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cerca nelle mappe mentali..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredMindMaps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery
              ? "Nessuna mappa mentale trovata con questa ricerca."
              : "Non hai ancora creato mappe mentali. Inizia ora!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMindMaps.map((mindmap) => (
            <Card key={mindmap.id}>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{mindmap.title}</CardTitle>
                <CardDescription>{formatDateTime(mindmap.updatedAt)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {mindmap.nodes.length} nodi, {mindmap.edges.length} connessioni
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/mappe/${mindmap.id}`}>
                  <Button variant="outline">Apri</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => deleteMindMap(mindmap.id)}>
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

