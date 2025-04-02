"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { get, put, getAll } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { Cloud, Save, Download, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams } from "next/navigation"
import ThemeCustomizer from "@/components/theme-customizer"
import { exportAsJson } from "@/lib/export-utils"

interface Settings {
  id: string
  aiApiEndpoint: string | null
  googleDriveEnabled: boolean
  googleDriveConfig: {
    clientId: string | null
    apiKey: string | null
  } | null
  theme: "light" | "dark" | "system" | string
  syncEnabled: boolean
  lastSyncDate: number | null
  customThemes?: any[]
  animationsEnabled?: boolean
  exportFormat?: "pdf" | "png" | "json"
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "general")

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    try {
      const settingsData = await get<"settings">("settings", "user-settings")
      if (settingsData) {
        setSettings(settingsData)
      } else {
        // Create default settings if not found
        const defaultSettings: Settings = {
          id: "user-settings",
          aiApiEndpoint: null,
          googleDriveEnabled: false,
          googleDriveConfig: null,
          theme: "system",
          syncEnabled: false,
          lastSyncDate: null,
          animationsEnabled: true,
          exportFormat: "pdf",
        }
        await put("settings", defaultSettings)
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error("Errore nel caricamento delle impostazioni:", error)
      toast({
        title: "Errore",
        description: "Impossibile caricare le impostazioni. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function saveSettings() {
    if (!settings) return

    setIsSaving(true)
    try {
      await put("settings", settings)
      toast({
        title: "Impostazioni salvate",
        description: "Le tue impostazioni sono state salvate con successo.",
      })
    } catch (error) {
      console.error("Errore nel salvataggio delle impostazioni:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  function updateSettings<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!settings) return

    setSettings({
      ...settings,
      [key]: value,
    })
  }

  async function exportData() {
    try {
      // Get all data from IndexedDB
      const notes = await getAll("notes")
      const mindmaps = await getAll("mindmaps")
      const decks = await getAll("flashcards")
      const tasks = await getAll("tasks")
      const files = await getAll("files")

      const exportData = {
        notes,
        mindmaps,
        decks,
        tasks,
        files,
        settings,
        exportDate: new Date().toISOString(),
      }

      exportAsJson(exportData, "studylab-export")

      toast({
        title: "Esportazione completata",
        description: "I tuoi dati sono stati esportati con successo.",
      })
    } catch (error) {
      console.error("Errore nell'esportazione dei dati:", error)
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati. Riprova più tardi.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Caricamento...</div>
  }

  if (!settings) {
    return <div className="flex justify-center items-center h-64">Impossibile caricare le impostazioni</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvataggio..." : "Salva Impostazioni"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">Generali</TabsTrigger>
          <TabsTrigger value="appearance">Aspetto</TabsTrigger>
          <TabsTrigger value="sync">Sincronizzazione</TabsTrigger>
          <TabsTrigger value="ai">Intelligenza Artificiale</TabsTrigger>
          <TabsTrigger value="data">Dati</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Generali</CardTitle>
              <CardDescription>Personalizza il comportamento dell'applicazione</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animazioni</Label>
                  <p className="text-sm text-muted-foreground">Abilita le animazioni dell'interfaccia</p>
                </div>
                <Switch
                  id="animations"
                  checked={settings.animationsEnabled !== false}
                  onCheckedChange={(checked) => updateSettings("animationsEnabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="export-format">Formato di esportazione predefinito</Label>
                <Select
                  value={settings.exportFormat || "pdf"}
                  onValueChange={(value) => updateSettings("exportFormat", value as "pdf" | "png" | "json")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <ThemeCustomizer />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sincronizzazione</CardTitle>
              <CardDescription>Configura la sincronizzazione dei dati con servizi esterni</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="google-drive">Google Drive</Label>
                  <p className="text-sm text-muted-foreground">Sincronizza i tuoi dati con Google Drive</p>
                </div>
                <Switch
                  id="google-drive"
                  checked={settings.googleDriveEnabled}
                  onCheckedChange={(checked) => updateSettings("googleDriveEnabled", checked)}
                />
              </div>

              {settings.googleDriveEnabled && (
                <div className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-client-id">Client ID</Label>
                    <Input
                      id="google-client-id"
                      value={settings.googleDriveConfig?.clientId || ""}
                      onChange={(e) =>
                        updateSettings("googleDriveConfig", {
                          ...settings.googleDriveConfig,
                          clientId: e.target.value || null,
                        })
                      }
                      placeholder="Inserisci il Client ID di Google"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-api-key">API Key</Label>
                    <Input
                      id="google-api-key"
                      value={settings.googleDriveConfig?.apiKey || ""}
                      onChange={(e) =>
                        updateSettings("googleDriveConfig", {
                          ...settings.googleDriveConfig,
                          apiKey: e.target.value || null,
                        })
                      }
                      placeholder="Inserisci l'API Key di Google"
                    />
                  </div>

                  <Button variant="outline" className="w-full">
                    <Cloud className="mr-2 h-4 w-4" />
                    Configura Google Drive
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Nota: La sincronizzazione con Google Drive richiede l'autorizzazione dell'utente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intelligenza Artificiale</CardTitle>
              <CardDescription>Configura l'integrazione con servizi di intelligenza artificiale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-endpoint">Endpoint API</Label>
                <Input
                  id="ai-endpoint"
                  placeholder="https://api.huggingface.co/models/..."
                  value={settings.aiApiEndpoint || ""}
                  onChange={(e) => updateSettings("aiApiEndpoint", e.target.value || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Inserisci l'URL dell'endpoint API di HuggingFace o DeepSeek per le funzionalità di AI. Se lasciato
                  vuoto, verrà utilizzato l'endpoint predefinito.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Dati</CardTitle>
              <CardDescription>Gestisci i tuoi dati locali e le opzioni di backup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Esporta Dati</h3>
                    <p className="text-sm text-muted-foreground">Scarica tutti i tuoi dati in formato JSON</p>
                  </div>
                  <Button variant="outline" onClick={exportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Esporta
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Importa Dati</h3>
                    <p className="text-sm text-muted-foreground">
                      Carica dati da un file JSON precedentemente esportato
                    </p>
                  </div>
                  <div className="relative">
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Importa
                      <input
                        type="file"
                        accept=".json"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          // Handle import logic
                          toast({
                            title: "Funzionalità in sviluppo",
                            description: "L'importazione dei dati sarà disponibile in una versione futura.",
                          })
                        }}
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-destructive">Cancella Dati</h3>
                    <p className="text-sm text-muted-foreground">
                      Elimina tutti i dati salvati localmente (questa azione non può essere annullata)
                    </p>
                  </div>
                  <Button variant="destructive">Cancella Tutto</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

