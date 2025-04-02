"use client"

import type React from "react"

import { useCallback, useEffect, useState, useRef } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  type NodeChange,
  type EdgeChange,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  Download,
  Upload,
  Maximize,
  Minimize,
  ImageIcon,
} from "lucide-react"
import { generateId } from "@/lib/utils"
import { storeFile } from "@/lib/file-storage"

// Custom node types
import TextNode from "./mind-map/text-node"
import ImageNode from "./mind-map/image-node"
import NoteNode from "./mind-map/note-node"

// Node types definition
const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  noteNode: NoteNode,
}

interface MindMapEditorProps {
  initialNodes: Node[]
  initialEdges: Edge[]
  onChange: (nodes: Node[], edges: Edge[]) => void
  readOnly?: boolean
}

function MindMapEditorContent({ initialNodes, initialEdges, onChange, readOnly = false }: MindMapEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const {
    project,
    fitView,
    zoomIn: flowZoomIn,
    zoomOut: flowZoomOut,
    setViewport,
    getViewport,
    getNodes,
    getEdges,
    setNodes: setReactFlowNodes,
    setEdges: setReactFlowEdges,
  } = useReactFlow()

  // Initialize with provided nodes and edges
  useEffect(() => {
    if (initialNodes.length > 0 || initialEdges.length > 0) {
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [])

  // Notify parent component of changes
  useEffect(() => {
    onChange(nodes, edges)
  }, [nodes, edges, onChange])

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Clear selected node if it's deleted
      changes.forEach((change) => {
        if (change.type === "remove" && selectedNode?.id === change.id) {
          setSelectedNode(null)
        }
      })
      onNodesChange(changes)
    },
    [onNodesChange, selectedNode],
  )

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange],
  )

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Create a new edge with arrow marker
      const newEdge = {
        ...params,
        id: `edge-${generateId()}`,
        type: "smoothstep",
        animated: false,
        style: { strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges],
  )

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // Handle background click (deselect nodes)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Add a new node
  const addNode = useCallback(
    (type = "textNode") => {
      const newNode: Node = {
        id: `node-${generateId()}`,
        type,
        position: {
          x: Math.random() * 300 + 50,
          y: Math.random() * 300 + 50,
        },
        data: {
          label: "Nuovo Nodo",
          content: "",
          imageUrl: type === "imageNode" ? "/placeholder.svg?height=150&width=150" : undefined,
        },
      }

      setNodes((nds) => [...nds, newNode])
      setSelectedNode(newNode)
    },
    [setNodes],
  )

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    // Also delete connected edges
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  // Update node data
  const updateNodeData = useCallback(
    (id: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, ...data } }
          }
          return node
        }),
      )
    },
    [setNodes],
  )

  // Auto layout nodes in a tree structure
  const autoLayout = useCallback(() => {
    // Find root nodes (nodes with no incoming edges)
    const nodeIds = new Set(nodes.map((node) => node.id))
    const targetIds = new Set(edges.map((edge) => edge.target))
    const rootIds = [...nodeIds].filter((id) => !targetIds.has(id))

    if (rootIds.length === 0) {
      toast({
        title: "Impossibile eseguire il layout automatico",
        description: "Non è stato possibile identificare un nodo radice.",
        variant: "destructive",
      })
      return
    }

    // Start with the first root node
    const rootId = rootIds[0]
    const positions = new Map<string, { x: number; y: number }>()
    const visited = new Set<string>()

    // Recursive function to position nodes
    const positionNode = (nodeId: string, level: number, index: number, totalAtLevel: number) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      // Calculate position
      const xSpacing = 250
      const ySpacing = 150
      const x = level * xSpacing
      const levelWidth = totalAtLevel * xSpacing
      const startX = -levelWidth / 2 + xSpacing / 2
      const y = startX + index * xSpacing

      positions.set(nodeId, { x, y })

      // Find children
      const childEdges = edges.filter((edge) => edge.source === nodeId)
      const children = childEdges.map((edge) => edge.target)

      // Position children
      children.forEach((childId, childIndex) => {
        positionNode(childId, level + 1, childIndex, children.length)
      })
    }

    // Start positioning from root
    positionNode(rootId, 0, 0, 1)

    // Update node positions
    setNodes((nds) =>
      nds.map((node) => {
        const position = positions.get(node.id)
        if (position) {
          return { ...node, position }
        }
        return node
      }),
    )

    // Fit view to show all nodes
    setTimeout(() => {
      fitView({ padding: 0.2 })
    }, 50)
  }, [nodes, edges, setNodes, fitView, toast])

  // Export mind map as JSON
  const exportMindMap = useCallback(() => {
    const data = {
      nodes: getNodes(),
      edges: getEdges(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `mindmap-${new Date().toISOString().slice(0, 10)}.json`
    a.click()

    URL.revokeObjectURL(url)
  }, [getNodes, getEdges])

  // Import mind map from JSON
  const importMindMap = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)

          if (data.nodes && data.edges) {
            setReactFlowNodes(data.nodes)
            setReactFlowEdges(data.edges)

            toast({
              title: "Mappa mentale importata",
              description: "La mappa mentale è stata importata con successo.",
            })

            setTimeout(() => {
              fitView({ padding: 0.2 })
            }, 50)
          } else {
            throw new Error("Invalid mind map data")
          }
        } catch (error) {
          console.error("Error importing mind map:", error)
          toast({
            title: "Errore",
            description: "Il file selezionato non contiene una mappa mentale valida.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)

      // Reset input value to allow importing the same file again
      event.target.value = ""
    },
    [setReactFlowNodes, setReactFlowEdges, fitView, toast],
  )

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      reactFlowWrapper.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Handle fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Handle image upload for image nodes
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      const fileMetadata = await storeFile(file)
      return fileMetadata.url
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error)
      throw error
    }
  }, [])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" style={{ height: "70vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Control"
        selectionKeyCode="Shift"
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        className="bg-muted/20"
        readOnly={readOnly}
      >
        <Background />
        <Controls />
        <MiniMap />

        <Panel position="top-right" className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => flowZoomIn()}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => flowZoomOut()}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={autoLayout}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </Panel>

        {!readOnly && (
          <Panel position="top-left" className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Aggiungi Nodo
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Tipo di nodo</h4>
                    <p className="text-sm text-muted-foreground">Seleziona il tipo di nodo da aggiungere</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button onClick={() => addNode("textNode")} variant="outline" className="justify-start">
                      <span className="mr-2">📝</span> Testo
                    </Button>
                    <Button onClick={() => addNode("noteNode")} variant="outline" className="justify-start">
                      <span className="mr-2">📒</span> Nota
                    </Button>
                    <Button onClick={() => addNode("imageNode")} variant="outline" className="justify-start">
                      <span className="mr-2">🖼️</span> Immagine
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {selectedNode && (
              <Button variant="outline" onClick={deleteSelectedNode}>
                <Trash2 className="h-4 w-4 mr-2" /> Elimina Nodo
              </Button>
            )}
          </Panel>
        )}

        <Panel position="bottom-left" className="flex gap-2">
          <Button variant="outline" size="icon" onClick={exportMindMap}>
            <Download className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button variant="outline" size="icon">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept=".json"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={importMindMap}
              />
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <div className="mt-4 p-4 border rounded-md bg-card">
          <h3 className="text-lg font-medium mb-4">Modifica Nodo</h3>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="node-label">Etichetta</Label>
              <Input
                id="node-label"
                value={selectedNode.data.label || ""}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
              />
            </div>

            {selectedNode.type === "noteNode" && (
              <div className="grid gap-2">
                <Label htmlFor="node-content">Contenuto</Label>
                <Textarea
                  id="node-content"
                  value={selectedNode.data.content || ""}
                  onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                  rows={4}
                />
              </div>
            )}

            {selectedNode.type === "imageNode" && (
              <div className="grid gap-2">
                <Label htmlFor="node-image">Immagine</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="node-image-url"
                    value={selectedNode.data.imageUrl || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { imageUrl: e.target.value })}
                    placeholder="URL dell'immagine"
                  />
                  <div className="relative">
                    <Button variant="outline" size="icon">
                      <ImageIcon className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          if (!e.target.files || !e.target.files[0]) return
                          try {
                            const imageUrl = await handleImageUpload(e.target.files[0])
                            updateNodeData(selectedNode.id, { imageUrl })
                          } catch (error) {
                            toast({
                              title: "Errore",
                              description: "Impossibile caricare l'immagine. Riprova più tardi.",
                              variant: "destructive",
                            })
                          }
                        }}
                      />
                    </Button>
                  </div>
                </div>
                {selectedNode.data.imageUrl && (
                  <div className="mt-2 border rounded-md p-2 max-w-xs">
                    <img
                      src={selectedNode.data.imageUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-32 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="node-style">Stile</Label>
              <Select
                value={selectedNode.data.style || "default"}
                onValueChange={(value) => updateNodeData(selectedNode.id, { style: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona uno stile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Predefinito</SelectItem>
                  <SelectItem value="primary">Primario</SelectItem>
                  <SelectItem value="secondary">Secondario</SelectItem>
                  <SelectItem value="accent">Accento</SelectItem>
                  <SelectItem value="warning">Avviso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap with ReactFlowProvider to use outside of a ReactFlow component
export default function MindMapEditor(props: MindMapEditorProps) {
  return (
    <ReactFlowProvider>
      <MindMapEditorContent {...props} />
    </ReactFlowProvider>
  )
}

