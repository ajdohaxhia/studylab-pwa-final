// File storage service for handling file uploads and storage
import { generateId } from "./utils"
import { add, get, getAll, remove, type FileItem } from "./db"

// Store files in IndexedDB
export async function storeFile(file: File): Promise<FileItem> {
  try {
    // Convert file to data URL for local storage
    const dataUrl = await readFileAsDataURL(file)

    // Create file metadata
    const fileMetadata: FileItem = {
      id: generateId(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: dataUrl,
      createdAt: Date.now(),
    }

    // Store in IndexedDB
    await add("files", fileMetadata)

    return fileMetadata
  } catch (error) {
    console.error("Error storing file:", error)
    throw new Error("Failed to store file")
  }
}

// Get file by ID
export async function getFile(fileId: string): Promise<FileItem | undefined> {
  try {
    return await get("files", fileId)
  } catch (error) {
    console.error("Error getting file:", error)
    throw new Error("Failed to get file")
  }
}

// Delete file by ID
export async function deleteFile(fileId: string): Promise<void> {
  try {
    await remove("files", fileId)
  } catch (error) {
    console.error("Error deleting file:", error)
    throw new Error("Failed to delete file")
  }
}

// List all files
export async function listFiles(): Promise<FileItem[]> {
  try {
    return await getAll("files")
  } catch (error) {
    console.error("Error listing files:", error)
    throw new Error("Failed to list files")
  }
}

// List files by type
export async function listFilesByType(type: string): Promise<FileItem[]> {
  try {
    const db = await getDB()
    return await db.getAllFromIndex("files", "by-type", type)
  } catch (error) {
    console.error("Error listing files by type:", error)
    throw new Error("Failed to list files by type")
  }
}

// Helper function to read file as data URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Open IndexedDB for file storage
async function getDB() {
  const { openDB } = await import("idb")
  return openDB("studylab-db", 1)
}

// Sync files with cloud storage (if available)
export async function syncFiles(endpoint: string | null): Promise<void> {
  if (!endpoint) return

  try {
    const files = await listFiles()

    // Send files to backend for sync
    const response = await fetch(`${endpoint}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "files",
        data: files,
      }),
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`)
    }
  } catch (error) {
    console.error("Error syncing files:", error)
    throw new Error("Failed to sync files")
  }
}

