import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function TextNode({ data, isConnectable }: NodeProps) {
  // Determine style based on data.style
  const getNodeStyle = () => {
    switch (data.style) {
      case "primary":
        return "bg-primary text-primary-foreground"
      case "secondary":
        return "bg-secondary text-secondary-foreground"
      case "accent":
        return "bg-accent text-accent-foreground"
      case "warning":
        return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100"
      default:
        return "bg-background text-foreground border-border"
    }
  }

  return (
    <div className={`px-4 py-2 rounded-md border shadow-sm ${getNodeStyle()}`}>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      <div className="font-medium text-center">{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </div>
  )
}

export default memo(TextNode)

