"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"
import { get, put } from "@/lib/db"
import { defaultThemes, type CustomTheme } from "./theme-provider"
import { Save, Trash2, RefreshCw, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ThemeCustomizer() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<CustomTheme | null>(null)
  const [newThemeName, setNewThemeName] = useState("")
  const [isCreatingTheme, setIsCreatingTheme] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [hue, setHue] = useState(221)
  const [saturation, setSaturation] = useState(83)
  const [lightness, setLightness] = useState(53)
  const [isSaving, setIsSaving] = useState(false)

  // Load custom themes
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const settings = await get("settings", "user-settings")
        if (settings?.customThemes) {
          setCustomThemes(settings.customThemes)
        } else {
          // Initialize with default themes
          setCustomThemes(defaultThemes)
        }
      } catch (error) {
        console.error("Error loading themes:", error)
        setCustomThemes(defaultThemes)
      }
    }

    loadThemes()
  }, [])

  // Set selected theme based on current theme
  useEffect(() => {
    if (theme && customThemes.length > 0) {
      const currentTheme = customThemes.find((t) => t.name === theme) || customThemes.find((t) => t.name === "default")
      if (currentTheme) {
        setSelectedTheme(currentTheme)

        // Parse HSL values
        const hslMatch = currentTheme.primary.match(/^(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%$/)
        if (hslMatch) {
          setHue(Number.parseFloat(hslMatch[1]))
          setSaturation(Number.parseFloat(hslMatch[2]))
          setLightness(Number.parseFloat(hslMatch[3]))
        }
      }
    }
  }, [theme, customThemes])

  // Save themes to database
  const saveThemes = async () => {
    setIsSaving(true)
    try {
      const settings = (await get("settings", "user-settings")) || { id: "user-settings" }

      await put("settings", {
        ...settings,
        customThemes,
      })

      toast({
        title: "Temi salvati",
        description: "Le tue impostazioni dei temi sono state salvate con successo.",
      })

      // Apply custom theme CSS variables
      customThemes.forEach((theme) => {
        if (!theme.isBuiltIn) {
          document.documentElement.style.setProperty(`--custom-${theme.name}-primary`, theme.primary)
          document.documentElement.style.setProperty(`--custom-${theme.name}-secondary`, theme.secondary)
          document.documentElement.style.setProperty(`--custom-${theme.name}-accent`, theme.accent)
          document.documentElement.style.setProperty(`--custom-${theme.name}-background`, theme.background)
          document.documentElement.style.setProperty(`--custom-${theme.name}-foreground`, theme.foreground)
        }
      })
    } catch (error) {
      console.error("Error saving themes:", error)
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni dei temi.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Create a new theme
  const createNewTheme = () => {
    if (!newThemeName.trim()) {
      toast({
        title: "Nome mancante",
        description: "Inserisci un nome per il nuovo tema.",
        variant: "destructive",
      })
      return
    }

    // Check if name already exists
    if (customThemes.some((t) => t.name === newThemeName.trim())) {
      toast({
        title: "Nome duplicato",
        description: "Esiste già un tema con questo nome.",
        variant: "destructive",
      })
      return
    }

    const newTheme: CustomTheme = {
      name: newThemeName.trim(),
      primary: `${hue} ${saturation}% ${lightness}%`,
      secondary: `${hue} 40% 96.1%`,
      accent: `${hue} ${saturation}% ${lightness}%`,
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      isBuiltIn: false,
    }

    setCustomThemes([...customThemes, newTheme])
    setSelectedTheme(newTheme)
    setNewThemeName("")
    setIsCreatingTheme(false)
    setIsDialogOpen(false)

    // Save the new themes
    setTimeout(() => {
      saveThemes()
    }, 100)

    toast({
      title: "Tema creato",
      description: `Il tema "${newTheme.name}" è stato creato con successo.`,
    })
  }

  // Delete a theme
  const deleteTheme = (themeName: string) => {
    // Don't allow deleting built-in themes
    const themeToDelete = customThemes.find((t) => t.name === themeName)
    if (themeToDelete?.isBuiltIn) {
      toast({
        title: "Operazione non consentita",
        description: "Non è possibile eliminare i temi predefiniti.",
        variant: "destructive",
      })
      return
    }

    const updatedThemes = customThemes.filter((t) => t.name !== themeName)
    setCustomThemes(updatedThemes)

    // If the current theme is deleted, switch to default
    if (theme === themeName) {
      setTheme("default")
    }

    // If the selected theme is deleted, select default
    if (selectedTheme?.name === themeName) {
      const defaultTheme = updatedThemes.find((t) => t.name === "default")
      if (defaultTheme) {
        setSelectedTheme(defaultTheme)
      }
    }

    // Save the updated themes
    setTimeout(() => {
      saveThemes()
    }, 100)

    toast({
      title: "Tema eliminato",
      description: `Il tema "${themeName}" è stato eliminato con successo.`,
    })
  }

  // Update theme colors
  const updateThemeColors = () => {
    if (!selectedTheme) return

    // Don't allow modifying built-in themes
    if (selectedTheme.isBuiltIn) {
      toast({
        title: "Operazione non consentita",
        description: "Non è possibile modificare i temi predefiniti. Crea un nuovo tema personalizzato.",
        variant: "destructive",
      })
      return
    }

    const primaryColor = `${hue} ${saturation}% ${lightness}%`
    const secondaryColor = `${hue} 40% 96.1%`

    const updatedTheme = {
      ...selectedTheme,
      primary: primaryColor,
      secondary: secondaryColor,
      accent: primaryColor,
    }

    const updatedThemes = customThemes.map((t) => (t.name === selectedTheme.name ? updatedTheme : t))

    setCustomThemes(updatedThemes)
    setSelectedTheme(updatedTheme)

    // Apply theme if it's the current one
    if (theme === selectedTheme.name) {
      // Update CSS variables
      document.documentElement.style.setProperty(`--custom-${selectedTheme.name}-primary`, primaryColor)
      document.documentElement.style.setProperty(`--custom-${selectedTheme.name}-secondary`, secondaryColor)
      document.documentElement.style.setProperty(`--custom-${selectedTheme.name}-accent`, primaryColor)
    }

    // Save the updated themes
    saveThemes()
  }

  // Apply a theme
  const applyTheme = (themeName: string) => {
    setTheme(themeName)

    const themeToApply = customThemes.find((t) => t.name === themeName)
    if (themeToApply) {
      setSelectedTheme(themeToApply)

      // Parse HSL values
      const hslMatch = themeToApply.primary.match(/^(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%$/)
      if (hslMatch) {
        setHue(Number.parseFloat(hslMatch[1]))
        setSaturation(Number.parseFloat(hslMatch[2]))
        setLightness(Number.parseFloat(hslMatch[3]))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Personalizzazione Tema</h2>
        <Button onClick={saveThemes} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvataggio..." : "Salva Temi"}
        </Button>
      </div>

      <Tabs defaultValue="select">
        <TabsList>
          <TabsTrigger value="select">Seleziona Tema</TabsTrigger>
          <TabsTrigger value="customize">Personalizza</TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customThemes.map((themeOption) => (
              <Card
                key={themeOption.name}
                className={`cursor-pointer hover-scale ${theme === themeOption.name ? "ring-2 ring-primary" : ""}`}
                onClick={() => applyTheme(themeOption.name)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{themeOption.name}</CardTitle>
                    {!themeOption.isBuiltIn && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Questa azione eliminerà permanentemente il tema "{themeOption.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTheme(themeOption.name)}>Elimina</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `hsl(${themeOption.primary})` }} />
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: `hsl(${themeOption.secondary})` }}
                    />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `hsl(${themeOption.accent})` }} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={theme === themeOption.name ? "default" : "outline"}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      applyTheme(themeOption.name)
                    }}
                  >
                    {theme === themeOption.name ? "Tema Attivo" : "Applica Tema"}
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover-scale flex flex-col items-center justify-center h-full min-h-[200px]">
                  <CardContent className="flex flex-col items-center justify-center h-full">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Crea nuovo tema</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea nuovo tema</DialogTitle>
                  <DialogDescription>Inserisci un nome per il tuo nuovo tema personalizzato.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme-name">Nome del tema</Label>
                    <Input
                      id="theme-name"
                      placeholder="Il mio tema"
                      value={newThemeName}
                      onChange={(e) => setNewThemeName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={createNewTheme}>Crea</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="customize" className="space-y-4">
          {selectedTheme ? (
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">Personalizza {selectedTheme.name}</CardTitle>
                <CardDescription>
                  {selectedTheme.isBuiltIn
                    ? "I temi predefiniti non possono essere modificati. Crea un nuovo tema personalizzato."
                    : "Modifica i colori del tema selezionato."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hue">Tonalità (Hue)</Label>
                    <span>{hue.toFixed(0)}°</span>
                  </div>
                  <Slider
                    id="hue"
                    min={0}
                    max={360}
                    step={1}
                    value={[hue]}
                    onValueChange={(value) => setHue(value[0])}
                    disabled={selectedTheme.isBuiltIn}
                  />
                  <div
                    className="h-8 w-full rounded-md mt-2"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(0, ${saturation}%, ${lightness}%), 
                        hsl(60, ${saturation}%, ${lightness}%), 
                        hsl(120, ${saturation}%, ${lightness}%), 
                        hsl(180, ${saturation}%, ${lightness}%), 
                        hsl(240, ${saturation}%, ${lightness}%), 
                        hsl(300, ${saturation}%, ${lightness}%), 
                        hsl(360, ${saturation}%, ${lightness}%))`,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="saturation">Saturazione</Label>
                    <span>{saturation.toFixed(0)}%</span>
                  </div>
                  <Slider
                    id="saturation"
                    min={0}
                    max={100}
                    step={1}
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    disabled={selectedTheme.isBuiltIn}
                  />
                  <div
                    className="h-8 w-full rounded-md mt-2"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(${hue}, 0%, ${lightness}%), 
                        hsl(${hue}, 50%, ${lightness}%), 
                        hsl(${hue}, 100%, ${lightness}%))`,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lightness">Luminosità</Label>
                    <span>{lightness.toFixed(0)}%</span>
                  </div>
                  <Slider
                    id="lightness"
                    min={0}
                    max={100}
                    step={1}
                    value={[lightness]}
                    onValueChange={(value) => setLightness(value[0])}
                    disabled={selectedTheme.isBuiltIn}
                  />
                  <div
                    className="h-8 w-full rounded-md mt-2"
                    style={{
                      background: `linear-gradient(to right, 
                        hsl(${hue}, ${saturation}%, 0%), 
                        hsl(${hue}, ${saturation}%, 50%), 
                        hsl(${hue}, ${saturation}%, 100%))`,
                    }}
                  />
                </div>

                <div className="pt-4">
                  <div className="text-sm font-medium mb-2">Anteprima</div>
                  <div className="flex gap-4">
                    <div
                      className="w-16 h-16 rounded-md"
                      style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
                    />
                    <div className="w-16 h-16 rounded-md" style={{ backgroundColor: `hsl(${hue}, 40%, 96.1%)` }} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset to original values
                    const hslMatch = selectedTheme.primary.match(/^(\d+\.?\d*)\s+(\d+\.?\d*)%\s+(\d+\.?\d*)%$/)
                    if (hslMatch) {
                      setHue(Number.parseFloat(hslMatch[1]))
                      setSaturation(Number.parseFloat(hslMatch[2]))
                      setLightness(Number.parseFloat(hslMatch[3]))
                    }
                  }}
                  disabled={selectedTheme.isBuiltIn}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Ripristina
                </Button>
                <Button onClick={updateThemeColors} disabled={selectedTheme.isBuiltIn}>
                  <Save className="mr-2 h-4 w-4" />
                  Applica Modifiche
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Seleziona un tema da personalizzare.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

