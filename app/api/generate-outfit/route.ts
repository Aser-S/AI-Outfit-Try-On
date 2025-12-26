import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    console.log("[v0] DEBUG: POST request received to /api/generate-outfit")

    const formData = await request.formData()
    console.log("[v0] DEBUG: FormData parsed successfully")

    const collageFile = formData.get("collage") as File | null
    const prompt = formData.get("prompt") as string | null
    const mode = formData.get("mode") as string | null

    console.log(
      `[v0] DEBUG: Received - collageFile: ${collageFile ? "yes" : "no"}, prompt: ${prompt ? "yes" : "no"}, mode: ${mode}`,
    )

    if (!collageFile || !prompt) {
      console.log("[v0] ERROR: Missing collageFile or prompt")
      return new Response(JSON.stringify({ error: "Collage image and prompt are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("[v0] DEBUG: Converting collage to base64...")
    const collageBuffer = await collageFile.arrayBuffer()
    const collageBase64 = Buffer.from(collageBuffer).toString("base64")
    console.log(`[v0] DEBUG: Collage base64 created - length: ${collageBase64.length}`)

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    console.log(`[v0] DEBUG: API Key check - available: ${apiKey ? "yes" : "no"}`)
    console.log(`[v0] DEBUG: API Key length: ${apiKey?.length || 0}`)
    console.log(`[v0] DEBUG: API Key first chars: ${apiKey ? apiKey.substring(0, 5) : "N/A"}...`)
    console.log(
      `[v0] DEBUG: All env vars available: ${Object.keys(process.env)
        .filter((k) => k.includes("GOOGLE") || k.includes("API"))
        .join(", ")}`,
    )

    if (!apiKey || apiKey.trim() === "") {
      console.log("[v0] ERROR: GOOGLE_GENERATIVE_AI_API_KEY not set or empty")
      console.log("[v0] ERROR: Make sure the API key is added in Vars section")
      return new Response(
        JSON.stringify({
          error: "API key not configured",
          details: "Make sure GOOGLE_GENERATIVE_AI_API_KEY is added in Vars",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[v0] DEBUG: Initializing GoogleGenerativeAI client...")
    const client = new GoogleGenerativeAI({ apiKey: apiKey.trim() })

    console.log("[v0] DEBUG: Getting model instance for gemini-2.5-flash-image...")
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    })

    console.log("[v0] DEBUG: Preparing content for API call...")

    console.log("[v0] DEBUG: Calling generateContent with safety config...")
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: collageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        responseMimeType: "image/jpeg",
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    })

    console.log("[v0] DEBUG: generateContent completed successfully")
    console.log(`[v0] DEBUG: Response candidates: ${response.response.candidates?.length || 0}`)

    const candidate = response.response.candidates?.[0]
    if (!candidate) {
      console.log("[v0] ERROR: No candidates in response")
      return new Response(JSON.stringify({ error: "No response generated" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`[v0] DEBUG: Response content parts: ${candidate.content.parts.length}`)

    let generatedImageData: string | null = null
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        console.log(`[v0] DEBUG: Found inline data - mimeType: ${part.inlineData.mimeType}`)
        generatedImageData = part.inlineData.data
        break
      } else if (part.text) {
        console.log(`[v0] DEBUG: Found text response instead of image: ${part.text.substring(0, 100)}`)
      }
    }

    if (!generatedImageData) {
      console.log("[v0] ERROR: No image data found in response")
      return new Response(JSON.stringify({ error: "Generated output was not an image" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`[v0] DEBUG: Image data extracted - length: ${generatedImageData.length}`)

    const imageBuffer = Buffer.from(generatedImageData, "base64")
    console.log("[v0] DEBUG: Image buffer created successfully, returning response")

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
      },
    })
  } catch (error) {
    console.error("[v0] FATAL ERROR in generate-outfit:", error)
    console.error("[v0] ERROR Stack:", error instanceof Error ? error.stack : "No stack trace")

    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`[v0] ERROR Message: ${errorMessage}`)

    return new Response(
      JSON.stringify({
        error: "Failed to generate outfit",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
