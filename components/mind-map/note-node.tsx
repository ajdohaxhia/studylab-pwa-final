import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function NoteNode({ data, isConnectable }: NodeProps) {
  // Determine style based on data.style
  const getNodeStyle = () => {
    switch (data.style) {
      case "primary":
        return "bg-primary/10 border-primary text-primary"
      case "secondary":
        return "bg-secondary/10 border-secondary text-secondary-foreground"
      case "accent":
        return "bg-accent/10 border-accent text-accent-foreground"
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-100"
      default:
        return "bg-card text-card-foreground border-border"
    }
  }

  return (
    <div className={`p-3 rounded-md border-2 shadow-sm min-w-[200px] max-w-[250px] ${getNodeStyle()}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      <div className="font-medium mb-2">{data.label}</div>
      {data.content && <div className="text-sm overflow-y-auto max-h-[150px] whitespace-pre-wrap">{data.content}</div>}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </div>
  )
}

export default memo(NoteNode)

