// AI service for integration with DeepSeek and Stable Diffusion
import { get } from "./db"

// Hugging Face API token
const HF_API_TOKEN = "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"

// Interface for AI request options
export interface AIRequestOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

// Interface for AI response
export interface AIResponse {
  text: string
  error?: string
}

// Get AI API endpoint from settings or environment variable
export async function getAIEndpoint(): Promise<string> {
  try {
    // Try to get from settings
    const settings = await get("settings", "user-settings")
    if (settings?.aiApiEndpoint) {
      return settings.aiApiEndpoint
    }
  } catch (error) {
    console.error("Error getting AI endpoint from settings:", error)
  }

  // Fallback to DeepSeek API endpoint
  return "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-33b-instruct"
}

// Get image generation API endpoint
export async function getImageAPIEndpoint(): Promise<string> {
  // Use the environment variable for Stable Diffusion
  if (process.env.NEXT_PUBLIC_IMAGE_API_URL) {
    return process.env.NEXT_PUBLIC_IMAGE_API_URL
  }

  // Fallback to Stable Diffusion XL
  return "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
}

// Generate text using DeepSeek
export async function generateText(prompt: string, options: AIRequestOptions = {}): Promise<AIResponse> {
  try {
    const endpoint = await getAIEndpoint()

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: options.temperature || 0.7,
          max_new_tokens: options.max_tokens || 512,
          top_p: options.top_p || 0.95,
          return_full_text: false,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    // Handle different response formats
    let generatedText = ""
    if (Array.isArray(data)) {
      generatedText = data[0]?.generated_text || ""
    } else if (data.generated_text) {
      generatedText = data.generated_text
    } else {
      generatedText = JSON.stringify(data)
    }

    return {
      text: generatedText,
    }
  } catch (error) {
    console.error("Error generating text:", error)
    return {
      text: "",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Generate image using Stable Diffusion
export async function generateImage(prompt: string, options: AIRequestOptions = {}): Promise<string | null> {
  try {
    const endpoint = await getImageAPIEndpoint()

    const response = await fetch(endpoint, {
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
      throw new Error(`API error: ${response.status} ${errorText}`)
    }

    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error("Error generating image:", error)
    return null
  }
}

// Generate flashcards from text
export async function generateFlashcards(text: string, count = 5): Promise<Array<{ front: string; back: string }>> {
  try {
    const prompt = `
      Genera ${count} flashcard in italiano basate sul seguente testo. 
      Ogni flashcard deve avere una domanda (fronte) e una risposta (retro).
      Formatta l'output come un array JSON di oggetti con proprietà "front" e "back".
      
      Testo: ${text}
    `

    const response = await generateText(prompt)

    if (response.error) {
      throw new Error(response.error)
    }

    // Try to extract JSON from the response
    const jsonMatch = response.text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error("Failed to parse JSON:", e)
        throw new Error("Failed to parse flashcards from response")
      }
    }

    throw new Error("Failed to parse flashcards from response")
  } catch (error) {
    console.error("Error generating flashcards:", error)
    return []
  }
}

// Summarize text
export async function summarizeText(text: string): Promise<string> {
  try {
    const prompt = `
      Riassumi il seguente testo in italiano, mantenendo i punti chiave e le informazioni importanti.
      
      Testo: ${text}
    `

    const response = await generateText(prompt)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.text
  } catch (error) {
    console.error("Error summarizing text:", error)
    return ""
  }
}

// Generate study recommendations
export async function generateStudyRecommendations(topic: string): Promise<string> {
  try {
    const prompt = `
      Genera consigli di studio in italiano per il seguente argomento. 
      Includi risorse, metodi di studio e suggerimenti pratici.
      
      Argomento: ${topic}
    `

    const response = await generateText(prompt)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.text
  } catch (error) {
    console.error("Error generating study recommendations:", error)
    return ""
  }
}

