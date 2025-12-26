/**
 * Image processing utilities for outfit try-on
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_DIMENSIONS = { width: 2000, height: 2000 }

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Validates an image file for upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a JPEG, PNG, or WebP image",
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size must be less than 10MB",
    }
  }

  return { valid: true }
}

/**
 * Optimizes an image by resizing and compressing
 */
export async function optimizeImage(file: File, options: ImageOptimizationOptions = {}): Promise<Blob> {
  const { maxWidth = MAX_DIMENSIONS.width, maxHeight = MAX_DIMENSIONS.height, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validates image dimensions
 */
export async function validateImageDimensions(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        // Image should be at least 300x300 for body photos
        if (img.width < 300 || img.height < 300) {
          resolve({
            valid: false,
            error: "Image must be at least 300x300 pixels",
          })
        } else {
          resolve({ valid: true })
        }
      }

      img.onerror = () => {
        resolve({
          valid: false,
          error: "Invalid image file",
        })
      }

      img.src = event.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Converts a File to base64 string for API transmission
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      // Extract base64 part after the comma
      const base64 = result.split(",")[1]
      resolve(base64)
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Converts a Blob to File
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type })
}
