export interface CollageOptions {
  spacing?: number
  padding?: number
  backgroundColor?: string
}

/**
 * Creates a collage from multiple images with spacing
 * For photo mode: [body photo] [top] [bottom] [shoes]
 * For mannequin mode: [top] [bottom] [shoes]
 */
export async function createCollage(
  images: { file: File; type: string }[],
  options: CollageOptions = {},
): Promise<Blob> {
  const { spacing = 30, padding = 30, backgroundColor = "#ffffff" } = options

  return new Promise((resolve, reject) => {
    const loadedImages: { img: HTMLImageElement; type: string }[] = []
    let loadedCount = 0

    // Load all images first
    images.forEach(({ file, type }) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          loadedImages.push({ img, type })
          loadedCount++

          if (loadedCount === images.length) {
            createCollageCanvas(loadedImages, spacing, padding, backgroundColor, resolve, reject)
          }
        }

        img.onerror = () => reject(new Error(`Failed to load image: ${type}`))
        img.src = event.target?.result as string
      }

      reader.onerror = () => reject(new Error(`Failed to read file: ${type}`))
      reader.readAsDataURL(file)
    })
  })
}

function createCollageCanvas(
  loadedImages: { img: HTMLImageElement; type: string }[],
  spacing: number,
  padding: number,
  backgroundColor: string,
  resolve: (blob: Blob) => void,
  reject: (error: Error) => void,
) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    reject(new Error("Failed to get canvas context"))
    return
  }

  // Calculate dimensions - arrange horizontally with consistent height
  const targetHeight = 500 // Increased height for better quality
  let totalWidth = padding * 2

  // Sort images to put body photo first if it exists
  const sortedImages = loadedImages.sort((a, b) => {
    if (a.type === "body") return -1
    if (b.type === "body") return 1
    return 0
  })

  const scaledImages = sortedImages.map(({ img, type }) => {
    const scale = targetHeight / img.height
    const width = img.width * scale
    return { width, height: targetHeight, type }
  })

  totalWidth += scaledImages.reduce((acc, img, idx) => {
    return acc + img.width + (idx < scaledImages.length - 1 ? spacing : 0)
  }, 0)

  canvas.width = totalWidth
  canvas.height = targetHeight + padding * 2

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Add subtle border for better visibility
  ctx.strokeStyle = "#e5e5e5"
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

  // Draw images with labels
  let xPosition = padding

  sortedImages.forEach(({ img, type }, index) => {
    const { width, height } = scaledImages[index]
    
    // Draw image
    ctx.drawImage(img, xPosition, padding, width, height)
    
    // Add subtle border around each image
    ctx.strokeStyle = "#d1d5db"
    ctx.lineWidth = 1
    ctx.strokeRect(xPosition, padding, width, height)
    
    // Add label below image
    ctx.fillStyle = "#374151"
    ctx.font = "14px Arial, sans-serif"
    ctx.textAlign = "center"
    const labelText = type === "body" ? "Person" : type
    ctx.fillText(labelText, xPosition + width / 2, padding + height + 20)
    
    xPosition += width + spacing
  })

  // Convert to blob with higher quality
  canvas.toBlob(
    (blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Failed to create collage blob"))
      }
    },
    "image/jpeg",
    0.9, // Higher quality
  )
}

/**
 * Builds system prompt for photo mode
 */
export function buildPhotoModePrompt(clothingTypes: string[]): string {
  const clothingList = clothingTypes.join(", ")

  return `I want to see how I would look wearing the clothes shown next to me in this collage image.

The clothing items I want to try on: ${clothingList}

INSTRUCTIONS:
- The collage shows me on the left side and the clothing items on the right side
- Show me wearing all the clothing items from the collage
- Keep my natural appearance and body proportions
- Ensure all clothing items fit properly on my body:
  * TOP: Fitted properly on my upper body
  * BOTTOM: Fitted properly on my lower body  
  * SHOES: On my feet
- Keep my natural pose and stance
- Clean, neutral background
- Professional fashion photography style
- Focus on showing how the complete outfit looks on me

Generate an image of me wearing the clothing items shown next to me in the collage.`
}

/**
 * Builds system prompt for mannequin mode
 */
export function buildMannequinModePrompt(measurements: {
  height: string
  weight: string
  gender: string
  chest?: string
  waist?: string
  hip?: string
  legHeight?: string
  isHijabi?: boolean
}): string {
  const clothingNote = "The clothing items will be provided in a separate collage image"

  let styleNote = ""
  if (measurements.gender === "female" && measurements.isHijabi) {
    styleNote = `The mannequin should be styled in modest hijab fashion:
- Wearing a hijab covering the head and neck
- Long-sleeved top or dress
- Pants/skirt that covers to the ankles
- Overall modest, professional appearance`
  }

  return `You are an expert fashion designer creating a perfect mannequin visualization. Create a high-quality image of a ${measurements.gender} fashion mannequin with the following EXACT specifications:

BODY MEASUREMENTS:
- Height: ${measurements.height} cm
- Weight: ${measurements.weight} kg
${measurements.chest ? `- Chest: ${measurements.chest} cm` : ""}
${measurements.waist ? `- Waist: ${measurements.waist} cm` : ""}
${measurements.hip ? `- Hip: ${measurements.hip} cm` : ""}
${measurements.legHeight ? `- Leg Height: ${measurements.legHeight} cm` : ""}

${styleNote || `${measurements.gender === "male" ? "Style: Professional male mannequin" : "Style: Professional female mannequin"}`}

MANNEQUIN REQUIREMENTS:
- Create a realistic fashion mannequin/model that matches these exact measurements
- The mannequin should have realistic human proportions based on the specified measurements
- Standing pose, facing forward, arms at sides
- Professional styling appropriate to the gender
- Clean, neutral background (white or light gray)
- High fashion photography quality
- The mannequin should look like an actual person with the specified proportions

${clothingNote}

Generate ONLY the mannequin. Do not add any clothing items yet - they will be added in the next step.`
}

/**
 * Builds system prompt for dressing the mannequin with detailed measurements
 */
export function buildMannequinOutfitPrompt(
  measurements: {
    height: string
    gender: string
    chest?: string
    waist?: string
    hip?: string
    legHeight?: string
    shoulderWidth?: string
    isHijabi?: boolean
  },
  clothingTypes: string[],
): string {
  const clothingList = clothingTypes.join(", ")

  let hijabNote = ""
  if (measurements.gender === "female" && measurements.isHijabi) {
    hijabNote = `
HIJAB STYLING REQUIREMENTS:
- The mannequin should wear a hijab covering the head and neck
- Ensure modest styling with appropriate coverage
- The clothing should complement the hijab styling`
  }

  return `You are an expert fashion visualizer and mannequin creator. You have been provided with clothing items in a collage image: ${clothingList}

Your task: Create a realistic fashion mannequin with the specified measurements wearing ALL the provided clothing items.

MANNEQUIN SPECIFICATIONS:
- Gender: ${measurements.gender}
- Height: ${measurements.height} cm (can be any height - kids welcome!)
${measurements.chest ? `- Chest: ${measurements.chest} cm` : ""}
${measurements.waist ? `- Waist: ${measurements.waist} cm` : ""}
${measurements.hip ? `- Hip: ${measurements.hip} cm` : ""}
${measurements.legHeight ? `- Leg height: ${measurements.legHeight} cm` : ""}
${measurements.shoulderWidth ? `- Shoulder width: ${measurements.shoulderWidth} cm` : ""}

CRITICAL INSTRUCTIONS:
- Create a professional fashion mannequin/model with realistic human proportions matching the exact measurements above
- The mannequin should have a body type that corresponds to the provided measurements
- Apply ALL clothing items from the collage naturally and realistically:
  * TOP: Fit properly on the upper body according to chest and shoulder measurements
  * BOTTOM: Fit properly on the lower body according to waist and hip measurements  
  * SHOES: Place appropriately on the feet
- The clothing should fit naturally based on the body measurements - not too tight or too loose
- Standing pose, facing forward, arms at sides or slightly away from body
- Clean, neutral background (white or light gray)
- Professional fashion photography quality with good lighting
- The mannequin should look proportional and realistic${hijabNote}

FITTING GUIDELINES:
- Use the chest and shoulder measurements for top sizing
- Use the waist and hip measurements for bottom sizing
- Ensure the leg height creates proper proportions
- The overall height should create a realistic human silhouette
- Pay attention to how the clothing drapes and fits on the body type

Output ONLY the mannequin wearing the complete outfit. Do not include the collage or original clothing items in the output.`
}
