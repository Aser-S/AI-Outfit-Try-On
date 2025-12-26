import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    console.log("[OUTFIT-API] POST request received to /api/generate-outfit")

    const formData = await request.formData()
    console.log("[OUTFIT-API] FormData parsed successfully")

    const collageFile = formData.get("collage") as File | null
    const prompt = formData.get("prompt") as string | null
    const mode = formData.get("mode") as string | null

    console.log(
      `[OUTFIT-API] Received - collageFile: ${collageFile ? "yes" : "no"}, prompt: ${prompt ? "yes" : "no"}, mode: ${mode}`,
    )

    if (!collageFile || !prompt) {
      console.log("[OUTFIT-API] ERROR: Missing collageFile or prompt")
      return new Response(JSON.stringify({ error: "Collage image and prompt are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("[OUTFIT-API] Converting collage to base64...")
    const collageBuffer = await collageFile.arrayBuffer()
    const collageBase64 = Buffer.from(collageBuffer).toString("base64")
    console.log(`[OUTFIT-API] Collage base64 created - length: ${collageBase64.length}`)

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    console.log(`[OUTFIT-API] API Key check - available: ${apiKey ? "yes" : "no"}`)
    console.log(`[OUTFIT-API] API Key length: ${apiKey?.length || 0}`)

    if (!apiKey || apiKey.trim() === "") {
      console.log("[OUTFIT-API] ERROR: GOOGLE_GENERATIVE_AI_API_KEY not set or empty")
      console.log("[OUTFIT-API] ERROR: Make sure the API key is added in .env.local file")
      return new Response(
        JSON.stringify({
          error: "API key not configured",
          details: "Make sure GOOGLE_GENERATIVE_AI_API_KEY is added in .env.local file",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("[OUTFIT-API] Initializing GoogleGenerativeAI client...")
    const genAI = new GoogleGenerativeAI(apiKey.trim())

    console.log("[OUTFIT-API] Getting model instance for gemini-2.5-flash-image")
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    })

    console.log("[OUTFIT-API] Preparing content for API call...")

    // Enhanced prompt for outfit generation based on collage
    let enhancedPrompt = ""
    if (mode === "photo") {
      enhancedPrompt = `I want to see how I would look wearing the clothes shown next to me in this collage image.

INSTRUCTIONS:
- The collage shows me on the left and clothing items on the right
- Show me wearing all the clothing items from the collage
- Keep my appearance natural and realistic
- Ensure all clothing items fit properly on my body
- Standing pose, facing forward
- Clean, neutral background
- Professional fashion photography style
- Focus on showing the complete outfit on me

Generate an image of me wearing the clothing items shown in the collage.`
    } else {
      // Mannequin mode - use the existing prompt that works
      enhancedPrompt = prompt // Use the detailed prompt from buildMannequinOutfitPrompt
    }

    console.log("[OUTFIT-API] Calling generateContent...")
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: enhancedPrompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: collageBase64,
              },
            },
          ],
        },
      ],
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
      // DO NOT include generationConfig with responseMimeType for image models
      // The gemini-2.5-flash-image model automatically returns images
    })

    console.log("[OUTFIT-API] generateContent completed successfully")
    console.log(`[OUTFIT-API] Response candidates: ${response.response.candidates?.length || 0}`)
    
    // COMPREHENSIVE DEBUGGING - Log everything about the response
    console.log("[OUTFIT-API] === FULL RESPONSE DEBUG START ===")
    console.log("[OUTFIT-API] Response object keys:", Object.keys(response))
    console.log("[OUTFIT-API] Response.response keys:", Object.keys(response.response))
    
    // Log the full response but truncate if too large
    const fullResponseStr = JSON.stringify(response.response, null, 2)
    if (fullResponseStr.length > 2000) {
      console.log("[OUTFIT-API] Full response (truncated):", fullResponseStr.substring(0, 2000) + "... [TRUNCATED]")
    } else {
      console.log("[OUTFIT-API] Full response:", fullResponseStr)
    }
    console.log("[OUTFIT-API] === FULL RESPONSE DEBUG END ===")

    const candidate = response.response.candidates?.[0]
    if (!candidate) {
      console.log("[OUTFIT-API] ERROR: No candidates in response")
      console.log("[OUTFIT-API] Available response keys:", Object.keys(response.response))
      if (response.response.promptFeedback) {
        console.log("[OUTFIT-API] Prompt feedback:", JSON.stringify(response.response.promptFeedback, null, 2))
      }
      return new Response(JSON.stringify({ error: "No response generated - content may have been blocked by safety filters" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // COMPREHENSIVE CANDIDATE DEBUGGING
    console.log("[OUTFIT-API] === CANDIDATE DEBUG START ===")
    console.log("[OUTFIT-API] Candidate keys:", Object.keys(candidate))
    console.log("[OUTFIT-API] Candidate structure:", JSON.stringify(candidate, null, 2))
    
    if (candidate.finishReason) {
      console.log("[OUTFIT-API] Finish reason:", candidate.finishReason)
    }
    if (candidate.safetyRatings) {
      console.log("[OUTFIT-API] Safety ratings:", JSON.stringify(candidate.safetyRatings, null, 2))
    }
    console.log("[OUTFIT-API] === CANDIDATE DEBUG END ===")

    // Check for different possible response structures
    let generatedImageData: string | null = null

    // Try different possible response structures
    if (candidate.content && candidate.content.parts) {
      console.log(`[OUTFIT-API] Found content.parts - ${candidate.content.parts.length} parts`)
      candidate.content.parts.forEach((part, index) => {
        console.log(`[OUTFIT-API] Part ${index} keys:`, Object.keys(part))
        
        // Check for inline data in the part
        if ('inlineData' in part && part.inlineData) {
          console.log(`[OUTFIT-API] Found inline data in part ${index} - mimeType: ${part.inlineData.mimeType}`)
          const dataLength = part.inlineData.data ? part.inlineData.data.length : 0
          console.log(`[OUTFIT-API] Inline data length: ${dataLength}`)
          if (!generatedImageData && part.inlineData.data) {
            generatedImageData = part.inlineData.data
          }
        } else if ('text' in part && part.text) {
          console.log(`[OUTFIT-API] Found text in part ${index}: ${part.text.substring(0, 200)}`)
        } else {
          console.log(`[OUTFIT-API] Unknown part ${index} type:`, Object.keys(part))
        }
      })
    } else {
      console.log("[OUTFIT-API] ERROR: No recognizable content structure")
      console.log("[OUTFIT-API] Candidate has content?", !!candidate.content)
      if (candidate.content) {
        console.log("[OUTFIT-API] Content keys:", Object.keys(candidate.content))
      }
      return new Response(JSON.stringify({ 
        error: "Invalid response structure from AI model", 
        details: `Candidate keys: ${Object.keys(candidate).join(', ')}`,
        hasContent: !!candidate.content,
        contentKeys: candidate.content ? Object.keys(candidate.content) : []
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!generatedImageData) {
      console.log("[OUTFIT-API] ERROR: No image data found in response")
      return new Response(JSON.stringify({ error: "Generated output was not an image" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // At this point, generatedImageData is definitely not null
    const imageDataString = generatedImageData as string
    console.log(`[OUTFIT-API] Image data extracted - length: ${imageDataString.length}`)

    const imageBuffer = Buffer.from(imageDataString, "base64")
    console.log("[OUTFIT-API] Image buffer created successfully, returning response")

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
      },
    })
  } catch (error) {
    console.error("[OUTFIT-API] FATAL ERROR in generate-outfit:", error)
    console.error("[OUTFIT-API] ERROR Stack:", error instanceof Error ? error.stack : "No stack trace")

    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`[OUTFIT-API] ERROR Message: ${errorMessage}`)

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