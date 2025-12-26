import { generateText } from "ai"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const measurements = await request.json()
    const { height, weight, gender, chest, waist, hip, legHeight, isHijabi } = measurements

    let prompt = `Generate a full-body fashion mannequin figure with these specifications:

Physical Measurements:
- Height: ${height} cm
- Weight: ${weight} kg
- Gender: ${gender}
${chest ? `- Chest: ${chest} cm` : ""}
${waist ? `- Waist: ${waist} cm` : ""}
${hip ? `- Hip: ${hip} cm` : ""}
${legHeight ? `- Leg Height: ${legHeight} cm` : ""}

Requirements:
- Create a professional-looking fashion mannequin/flat lay model
- Show the full body from head to toe
- Use a neutral background
- Display proportions that accurately match the given measurements
- Should look like a realistic fashion model or design dummy
- Include proper posture and balanced stance
- Professional lighting and rendering
- Suitable for fashion/outfit visualization`

    if (isHijabi && gender === "female") {
      prompt += `
- The mannequin should be styled with hijab (head covering)
- Show modest clothing: long-sleeved top and long pants/skirt
- Ensure the hijab frames the face appropriately
- This is for testing modest fashion and hijab styling`
    }

    prompt +=
      "\n\nGenerate a high-quality image of this fashion mannequin that can be used as a base for trying on clothes."

    const result = await generateText({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      maxOutputTokens: 1024,
    })

    // Extract generated image
    if (!result.files || result.files.length === 0) {
      return new Response(JSON.stringify({ error: "No mannequin image generated" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const imageFile = result.files.find((f) => f.mediaType.startsWith("image/"))
    if (!imageFile) {
      return new Response(JSON.stringify({ error: "Generated output was not an image" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Convert base64 to buffer and return as image
    const imageBuffer = Buffer.from(imageFile.base64, "base64")

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": imageFile.mediaType,
      },
    })
  } catch (error) {
    console.error("Error generating mannequin:", error)
    return new Response(JSON.stringify({ error: "Failed to generate mannequin", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
