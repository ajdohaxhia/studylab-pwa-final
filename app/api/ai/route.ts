import { type NextRequest, NextResponse } from "next/server"

// Hugging Face API token
const HF_API_TOKEN = "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"

// Default API endpoint if none is provided
const DEFAULT_API_ENDPOINT = "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-33b-instruct"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { prompt, endpoint, options } = body

    // Use provided endpoint or default
    const apiEndpoint = endpoint || DEFAULT_API_ENDPOINT

    // Make request to AI API
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: options?.temperature || 0.7,
          max_new_tokens: options?.max_tokens || 512,
          top_p: options?.top_p || 0.95,
          return_full_text: false,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Errore API: ${response.status} ${errorText}` }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({ result: data })
  } catch (error) {
    console.error("Errore nel processare la richiesta AI:", error)
    return NextResponse.json({ error: "Errore nel processare la richiesta AI" }, { status: 500 })
  }
}

