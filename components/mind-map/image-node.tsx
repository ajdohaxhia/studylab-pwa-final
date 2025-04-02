import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

function ImageNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="rounded-md border shadow-sm bg-card overflow-hidden max-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
      <div className="p-2 font-medium text-center border-b">{data.label}</div>
      <div className="p-2">
        <img
          src={data.imageUrl || "/placeholder.svg?height=150&width=150"}
          alt={data.label}
          className="max-w-full h-auto object-contain mx-auto"
          style={{ maxHeight: "150px" }}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=150&width=150"
          }}
        />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </div>
  )
}

export default memo(ImageNode)

