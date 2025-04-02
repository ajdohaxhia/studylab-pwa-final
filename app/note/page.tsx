"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Trash2, Tag } from "lucide-react"
import { getAll, add, remove } from "@/lib/db"
import { generateId, formatDateTime } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { incrementAchievementProgress } from "@/lib/achievement-service"

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

export default function NotePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadNotes()
  }, [])

  // Extract all unique tags from notes
  useEffect(() => {
    const tags = new Set<string>()
    notes.forEach((note) => {
      note.tags.forEach((tag) => tags.add(tag))
    })
    setAvailableTags(Array.from(tags))
  }, [notes])

  async function loadNotes() {
    try {
      const allNotes = await getAll<"notes">("notes")
      setNotes(allNotes.sort((a, b) => b.updatedAt - a.updatedAt))
    } catch (error) {
      console.error("Errore nel caricamento delle note:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare le note. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function createNewNote() {
    const newNote: Note = {
      id: generateId(),
      title: "Nuova Nota",
      content: "",
      tags: [],
      media: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      await add("notes", newNote)

      // Update achievements
      if (notes.length === 0) {
        // First note achievement
        await incrementAchievementProgress("first-note", 1)
      }

      // Note master achievement
      await incrementAchievementProgress("note-master", 1)

      toast({
        title: "Nota creata",
        description: "La nuova nota è stata creata con successo.",
      })
      loadNotes()
    } catch (error) {
      console.error("Errore nella creazione della nota:", error)
      toast({
        title: "Errore",
        description: "Impossibile creare la nota. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  async function deleteNote(id: string) {
    try {
      await remove("notes", id)
      toast({
        title: "Nota eliminata",
        description: "La nota è stata eliminata con successo.",
      })
      loadNotes()
    } catch (error) {
      console.error("Errore nell'eliminazione della nota:", error)
      toast({
        title: "Errore",
        description: "Impossibile eliminare la nota. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  function toggleFilterTag(tag: string) {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter((t) => t !== tag))
    } else {
      setFilterTags([...filterTags, tag])
    }
  }

  // Filter notes by search query and tags
  const filteredNotes = notes.filter((note) => {
    // Filter by search query
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by tags
    const matchesTags = filterTags.length === 0 || filterTags.some((tag) => note.tags.includes(tag))

    return matchesSearch && matchesTags
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Le Mie Note</h1>
        <Button onClick={createNewNote}>
          <Plus className="mr-2 h-4 w-4" /> Nuova Nota
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca nelle note..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={filterTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilterTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || filterTags.length > 0
              ? "Nessuna nota trovata con questa ricerca."
              : "Non hai ancora creato note. Inizia ora!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{note.title}</CardTitle>
                <CardDescription>{formatDateTime(note.updatedAt)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="line-clamp-3 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: note.content || "Nessun contenuto" }}
                />

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href={`/note/${note.id}`}>
                  <Button variant="outline">Apri</Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
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

