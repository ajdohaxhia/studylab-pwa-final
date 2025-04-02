// IndexedDB database service for offline storage
import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { ReviewData } from "./spaced-repetition"

// Define the database schema
interface StudyLabDB extends DBSchema {
  notes: {
    key: string
    value: {
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
    indexes: { "by-date": number; "by-tag": string[] }
  }
  mindmaps: {
    key: string
    value: {
      id: string
      title: string
      nodes: any[]
      edges: any[]
      createdAt: number
      updatedAt: number
    }
    indexes: { "by-date": number }
  }
  flashcards: {
    key: string
    value: {
      id: string
      deckId: string
      front: string
      back: string
      reviewData: ReviewData
      createdAt: number
    }
    indexes: { "by-deck": string; "by-due-date": number }
  }
  decks: {
    key: string
    value: {
      id: string
      title: string
      description: string
      createdAt: number
      updatedAt: number
    }
  }
  tasks: {
    key: string
    value: {
      id: string
      title: string
      description: string
      dueDate: number | null
      completed: boolean
      priority: "low" | "medium" | "high"
      tags: string[]
      createdAt: number
    }
    indexes: { "by-due-date": number; "by-completed": boolean; "by-priority": string }
  }
  files: {
    key: string
    value: {
      id: string
      name: string
      type: string
      size: number
      url: string
      createdAt: number
    }
    indexes: { "by-type": string }
  }
  settings: {
    key: string
    value: {
      id: string
      aiApiEndpoint: string | null
      googleDriveEnabled: boolean
      googleDriveConfig: {
        clientId: string | null
        apiKey: string | null
      } | null
      theme: "light" | "dark" | "system"
      syncEnabled: boolean
      lastSyncDate: number | null
    }
  }
  achievements: {
    key: string
    value: {
      id: string
      title: string
      description: string
      icon: string
      unlocked: boolean
      progress: number
      maxProgress: number
      unlockedAt: number | null
    }
  }
  events: {
    key: string
    value: {
      id: string
      title: string
      description: string
      date: number
      endDate?: number
      allDay: boolean
      color: string
      taskId?: string
      createdAt: number
    }
    indexes: { "by-date": number }
  }
}

// Database version
const DB_VERSION = 1
const DB_NAME = "studylab-db"

// Initialize the database
async function initDB(): Promise<IDBPDatabase<StudyLabDB>> {
  return openDB<StudyLabDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains("notes")) {
        const notesStore = db.createObjectStore("notes", { keyPath: "id" })
        notesStore.createIndex("by-date", "updatedAt")
        notesStore.createIndex("by-tag", "tags", { multiEntry: true })
      }

      if (!db.objectStoreNames.contains("mindmaps")) {
        const mindmapsStore = db.createObjectStore("mindmaps", { keyPath: "id" })
        mindmapsStore.createIndex("by-date", "updatedAt")
      }

      if (!db.objectStoreNames.contains("flashcards")) {
        const flashcardsStore = db.createObjectStore("flashcards", { keyPath: "id" })
        flashcardsStore.createIndex("by-deck", "deckId")
        flashcardsStore.createIndex("by-due-date", "reviewData.dueDate")
      }

      if (!db.objectStoreNames.contains("decks")) {
        db.createObjectStore("decks", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("tasks")) {
        const tasksStore = db.createObjectStore("tasks", { keyPath: "id" })
        tasksStore.createIndex("by-due-date", "dueDate")
        tasksStore.createIndex("by-completed", "completed")
        tasksStore.createIndex("by-priority", "priority")
      }

      if (!db.objectStoreNames.contains("files")) {
        const filesStore = db.createObjectStore("files", { keyPath: "id" })
        filesStore.createIndex("by-type", "type")
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("achievements")) {
        db.createObjectStore("achievements", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("events")) {
        const eventsStore = db.createObjectStore("events", { keyPath: "id" })
        eventsStore.createIndex("by-date", "date")
      }
    },
  })
}

// Get database instance (singleton)
let dbPromise: Promise<IDBPDatabase<StudyLabDB>> | null = null

export function getDB(): Promise<IDBPDatabase<StudyLabDB>> {
  if (!dbPromise) {
    dbPromise = initDB()
  }
  return dbPromise
}

// Generic CRUD operations
export async function add<T extends keyof StudyLabDB>(storeName: T, item: StudyLabDB[T]["value"]): Promise<string> {
  const db = await getDB()
  const id = await db.add(storeName, item)
  return String(id)
}

export async function get<T extends keyof StudyLabDB>(
  storeName: T,
  id: string,
): Promise<StudyLabDB[T]["value"] | undefined> {
  const db = await getDB()
  return db.get(storeName, id)
}

export async function getAll<T extends keyof StudyLabDB>(storeName: T): Promise<StudyLabDB[T]["value"][]> {
  const db = await getDB()
  return db.getAll(storeName)
}

export async function getAllFromIndex<T extends keyof StudyLabDB>(
  storeName: T,
  indexName: string,
  query: IDBValidKey | IDBKeyRange,
): Promise<StudyLabDB[T]["value"][]> {
  const db = await getDB()
  return db.getAllFromIndex(storeName, indexName, query)
}

export async function put<T extends keyof StudyLabDB>(storeName: T, item: StudyLabDB[T]["value"]): Promise<void> {
  const db = await getDB()
  await db.put(storeName, item)
}

export async function remove<T extends keyof StudyLabDB>(storeName: T, id: string): Promise<void> {
  const db = await getDB()
  await db.delete(storeName, id)
}

// Initialize default settings if they don't exist
export async function initSettings(): Promise<void> {
  const db = await getDB()
  const settings = await db.get("settings", "user-settings")

  if (!settings) {
    await db.put("settings", {
      id: "user-settings",
      aiApiEndpoint: null,
      googleDriveEnabled: false,
      googleDriveConfig: null,
      theme: "system",
      syncEnabled: false,
      lastSyncDate: null,
    })
  }

  // Initialize default achievements
  const achievements = await db.getAll("achievements")
  if (achievements.length === 0) {
    const defaultAchievements = [
      {
        id: "first-note",
        title: "Prima Nota",
        description: "Hai creato la tua prima nota",
        icon: "📝",
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        unlockedAt: null,
      },
      {
        id: "note-master",
        title: "Maestro di Note",
        description: "Hai creato 10 note",
        icon: "📚",
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        unlockedAt: null,
      },
      {
        id: "first-mindmap",
        title: "Prima Mappa Mentale",
        description: "Hai creato la tua prima mappa mentale",
        icon: "🧠",
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        unlockedAt: null,
      },
      {
        id: "first-flashcard-deck",
        title: "Primo Mazzo di Flashcard",
        description: "Hai creato il tuo primo mazzo di flashcard",
        icon: "🎴",
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        unlockedAt: null,
      },
      {
        id: "study-streak",
        title: "Streak di Studio",
        description: "Hai studiato per 5 giorni consecutivi",
        icon: "🔥",
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        unlockedAt: null,
      },
    ]

    for (const achievement of defaultAchievements) {
      await db.add("achievements", achievement)
    }
  }
}

// Call this function when the app starts
export function initDatabase(): Promise<void> {
  return initSettings()
}

// Export types for use in other files
export type Note = StudyLabDB["notes"]["value"]
export type MindMap = StudyLabDB["mindmaps"]["value"]
export type Flashcard = StudyLabDB["flashcards"]["value"]
export type Deck = StudyLabDB["decks"]["value"]
export type Task = StudyLabDB["tasks"]["value"]
export type FileItem = StudyLabDB["files"]["value"]
export type Settings = StudyLabDB["settings"]["value"]
export type Achievement = StudyLabDB["achievements"]["value"]
export type Event = StudyLabDB["events"]["value"]

