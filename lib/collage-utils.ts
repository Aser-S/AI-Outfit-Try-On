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
  const { spacing = 20, padding = 20, backgroundColor = "#ffffff" } = options

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

  // Calculate dimensions - arrange horizontally
  const targetHeight = 400 // Standard height for all images
  let totalWidth = padding * 2

  const scaledImages = loadedImages.map(({ img }) => {
    const scale = targetHeight / img.height
    const width = img.width * scale
    return { width, height: targetHeight }
  })

  totalWidth += scaledImages.reduce((acc, img, idx) => {
    return acc + img.width + (idx < scaledImages.length - 1 ? spacing : 0)
  }, 0)

  canvas.width = totalWidth
  canvas.height = targetHeight + padding * 2

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw images
  let xPosition = padding

  loadedImages.forEach(({ img }, index) => {
    const { width, height } = scaledImages[index]
    ctx.drawImage(img, xPosition, padding, width, height)
    xPosition += width + spacing
  })

  // Convert to blob
  canvas.toBlob(
    (blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Failed to create collage blob"))
      }
    },
    "image/jpeg",
    0.85,
  )
}

/**
 * Builds system prompt for photo mode
 */
export function buildPhotoModePrompt(clothingTypes: string[]): string {
  const clothingList = clothingTypes.join(", ")

  return `You are an expert fashion visualizer. The user has provided a collage image containing:
1. Their full-body photo on the LEFT side
2. Individual clothing items on the RIGHT side: ${clothingList}

Your task: Create a highly realistic image of the person from the left side of the collage now wearing ALL the clothing items shown on the right side of the collage. 

CRITICAL INSTRUCTIONS:
- Maintain the person's face, head shape, skin tone, and body proportions EXACTLY as shown
- The person should appear to be standing in a natural pose, facing forward
- Dress them realistically in ALL the provided clothing items:
  * If a TOP is provided: wear it properly fitted
  * If BOTTOM is provided: wear it properly fitted
  * If SHOES are provided: wear them on their feet
- The clothing should fit naturally on their body - not oversized or undersized
- The background should be clean and simple (white or neutral)
- The overall lighting and skin tone should match the original photo
- Generate a complete, professional-looking outfit visualization
- The person should look like themselves, just in the new outfit

Output ONLY the image of the person in the outfit. Do not include the original clothing items or collage in the output.`
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
 * Builds system prompt for dressing the mannequin
 */
export function buildMannequinOutfitPrompt(
  measurements: {
    height: string
    weight?: string
    gender: string
    chest?: string
    waist?: string
    hip?: string
    legHeight?: string
    isHijabi?: boolean
  },
  clothingTypes: string[],
): string {
  const clothingList = clothingTypes.join(", ")

  let hijabNote = ""
  if (measurements.gender === "female" && measurements.isHijabi) {
    hijabNote = `The mannequin is wearing hijab styling. Ensure the clothing fits over/with the hijab appropriately.`
  }

  return `You are an expert fashion visualizer. You have been provided with:
1. A fashion mannequin image (left side of collage)
2. Clothing items to dress it in (right side of collage): ${clothingList}

Your task: Take the mannequin and realistically dress it in ALL the provided clothing items shown in the collage.

CRITICAL INSTRUCTIONS:
- Keep the mannequin's body shape and proportions EXACTLY as shown
- Height: ${measurements.height} cm
${measurements.chest ? `- Chest measurement: ${measurements.chest} cm` : ""}
${measurements.waist ? `- Waist measurement: ${measurements.waist} cm` : ""}
${measurements.hip ? `- Hip measurement: ${measurements.hip} cm` : ""}
${measurements.legHeight ? `- Leg height: ${measurements.legHeight} cm` : ""}
- Apply ALL clothing items from the collage:
  * TOP: Fit it properly on the upper body
  * BOTTOM: Fit it properly on the lower body
  * SHOES: Place them on the feet
${hijabNote}
- The clothing should fit naturally based on the body measurements
- Maintain realistic proportions and fitting
- Keep the same pose and background
- Professional fashion visualization quality

Output ONLY the mannequin in the complete outfit. Do not include the collage or original clothing items.`
}
