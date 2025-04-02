import AIAssistant from "@/components/ai-assistant"

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Assistente AI</h1>
      </div>

      <AIAssistant />
    </div>
  )
}

