import { type NextRequest, NextResponse } from "next/server"

// Hugging Face API token
const HF_API_TOKEN = "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"

// Default API endpoint for image generation
const DEFAULT_IMAGE_API_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGE_API_URL ||
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json()
    const { prompt, endpoint, options } = body

    // Use provided endpoint or default
    const apiEndpoint = endpoint || DEFAULT_IMAGE_API_ENDPOINT

    // Make request to AI API for image generation
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: "blurry, bad quality, distorted, disfigured",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Errore API: ${response.status} ${errorText}` }, { status: response.status })
    }

    // Return the image directly
    const imageBuffer = await response.arrayBuffer()
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    console.error("Errore nel processare la richiesta di generazione immagine:", error)
    return NextResponse.json({ error: "Errore nel processare la richiesta di generazione immagine" }, { status: 500 })
  }
}

