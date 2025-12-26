"use client"

import React from "react"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ChevronLeft, Upload, X, AlertCircle, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateImageFile, optimizeImage, validateImageDimensions } from "@/lib/image-utils"
import { createCollage, buildPhotoModePrompt } from "@/lib/collage-utils"

interface PhotoModeProps {
  onBack: () => void
}

export default function PhotoMode({ onBack }: PhotoModeProps) {
  const [bodyImage, setBodyImage] = useState<File | null>(null)
  const [bodyPreview, setBodyPreview] = useState<string | null>(null)
  const [clothingItems, setClothingItems] = useState<{ type: string; file: File; preview: string }[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add debugging when component loads
  React.useEffect(() => {
    console.log("[PHOTO-MODE] Component loaded - Photo Mode initialized")
    console.log("[PHOTO-MODE] API endpoint available at: /api/generate-outfit")
    console.log("[PHOTO-MODE] Ready to accept body image and clothing uploads")
  }, [])

  const handleBodyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    console.log("[PHOTO-MODE] Body image upload started")

    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.log(`[PHOTO-MODE] ERROR: File validation failed - ${validation.error}`)
      setError(validation.error || "Invalid image")
      return
    }

    console.log("[PHOTO-MODE] File validation passed")

    const dimensionCheck = await validateImageDimensions(file)
    if (!dimensionCheck.valid) {
      console.log(`[PHOTO-MODE] ERROR: Dimension check failed - ${dimensionCheck.error}`)
      setError(dimensionCheck.error || "Image dimensions invalid")
      return
    }

    console.log("[PHOTO-MODE] Dimension validation passed")

    try {
      console.log("[PHOTO-MODE] Starting image optimization...")
      const optimized = await optimizeImage(file)
      console.log(`[PHOTO-MODE] Image optimized - original: ${file.size}B, optimized: ${optimized.size}B`)

      const optimizedFile = new File([optimized], file.name, { type: "image/jpeg" })

      setBodyImage(optimizedFile)
      const preview = URL.createObjectURL(optimized)
      setBodyPreview(preview)
      console.log("[PHOTO-MODE] Body image set successfully")
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.log(`[PHOTO-MODE] ERROR: Image optimization failed - ${errorMsg}`)
      setError("Failed to process image. Please try a different file.")
    }
  }

  const handleClothingUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    console.log(`[PHOTO-MODE] Clothing upload started for type: ${type}`)

    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.log(`[PHOTO-MODE] ERROR: Clothing file validation failed - ${validation.error}`)
      setError(validation.error || "Invalid image")
      return
    }

    console.log(`[PHOTO-MODE] Clothing validation passed for ${type}`)

    try {
      console.log(`[PHOTO-MODE] Starting optimization for ${type}...`)
      const optimized = await optimizeImage(file)
      console.log(`[PHOTO-MODE] ${type} optimized - original: ${file.size}B, optimized: ${optimized.size}B`)

      const optimizedFile = new File([optimized], file.name, { type: "image/jpeg" })
      const preview = URL.createObjectURL(optimized)

      setClothingItems((prev) => [...prev.filter((item) => item.type !== type), { type, file: optimizedFile, preview }])
      console.log(`[PHOTO-MODE] ${type} added to clothing items`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.log(`[PHOTO-MODE] ERROR: Clothing optimization failed for ${type} - ${errorMsg}`)
      setError("Failed to process clothing image. Please try a different file.")
    }
  }

  const removeClothing = (type: string) => {
    console.log(`[PHOTO-MODE] Removing clothing item: ${type}`)
    setClothingItems((prev) => prev.filter((item) => item.type !== type))
  }

  const handleGenerate = async () => {
    setError(null)
    console.log("[PHOTO-MODE] Generate button clicked")

    if (!bodyImage || clothingItems.length === 0) {
      const errorMsg = "Please upload a body image and at least one clothing item"
      console.log(`[PHOTO-MODE] ERROR: Validation failed - ${errorMsg}`)
      setError(errorMsg)
      return
    }

    console.log(`[PHOTO-MODE] Validation passed - body image: yes, clothing items: ${clothingItems.length}`)

    setIsGenerating(true)
    try {
      console.log("[PHOTO-MODE] Starting collage creation...")
      const allImages = [
        { file: bodyImage, type: "body" },
        ...clothingItems.map((item) => ({ file: item.file, type: item.type })),
      ]

      const collageBlob = await createCollage(allImages)
      const collageFile = new File([collageBlob], "collage.jpg", { type: "image/jpeg" })
      console.log(`[PHOTO-MODE] Collage created - size: ${collageFile.size}B`)

      const prompt = buildPhotoModePrompt(clothingItems.map((item) => item.type))
      console.log(`[PHOTO-MODE] Prompt built - length: ${prompt.length} characters`)

      const formData = new FormData()
      formData.append("collage", collageFile)
      formData.append("prompt", prompt)
      formData.append("mode", "photo")

      console.log("[PHOTO-MODE] FormData prepared, sending to API...")
      const response = await fetch("/api/generate-outfit", {
        method: "POST",
        body: formData,
      })

      console.log(`[PHOTO-MODE] API response status: ${response.status}`)

      if (!response.ok) {
        console.log("[PHOTO-MODE] Response not OK, attempting to parse error...")
        const errorData = await response.json().catch(() => {
          console.log("[PHOTO-MODE] Could not parse error JSON")
          return {}
        })
        console.log(`[PHOTO-MODE] ERROR: API error response - ${JSON.stringify(errorData)}`)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log("[PHOTO-MODE] Parsing response blob...")
      const blob = await response.blob()
      console.log(`[PHOTO-MODE] Blob received - size: ${blob.size}B, type: ${blob.type}`)

      const imageUrl = URL.createObjectURL(blob)
      setResultImage(imageUrl)
      console.log("[PHOTO-MODE] Result image set successfully")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate outfit"
      console.error("[PHOTO-MODE] FATAL ERROR in handleGenerate:", err)
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!resultImage) return

    try {
      console.log("[PHOTO-MODE] Starting download...")
      const response = await fetch(resultImage)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `photo-outfit-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log("[PHOTO-MODE] Download completed")
    } catch (err) {
      console.error("[PHOTO-MODE] Download failed:", err)
      setError("Failed to download image")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-1 hover:bg-muted rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Photo Mode</h2>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Photo</CardTitle>
              <CardDescription>Upload a full-body photo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="block">
                  <input type="file" accept="image/*" onChange={handleBodyImageUpload} className="hidden" />
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    {bodyPreview ? (
                      <div className="space-y-2">
                        <div className="relative w-full aspect-[3/4]">
                          <Image
                            src={bodyPreview || "/placeholder.svg"}
                            alt="Body"
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                        <p className="text-xs text-muted-foreground mt-2">JPEG, PNG or WebP • Max 10MB</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Clothing Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clothing Items</CardTitle>
              <CardDescription>Add up to 3 pieces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Top", "Bottom", "Shoes"].map((type) => (
                <div key={type}>
                  <label className="text-sm font-medium block mb-2">{type}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleClothingUpload(type, e)}
                    className="hidden"
                    id={`clothing-${type}`}
                  />
                  <label htmlFor={`clothing-${type}`} className="block">
                    <div className="border border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      {clothingItems.find((i) => i.type === type) ? (
                        <div className="relative w-full aspect-square">
                          <Image
                            src={clothingItems.find((i) => i.type === type)!.preview || "/placeholder.svg"}
                            alt={type}
                            fill
                            className="object-contain rounded"
                          />
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              removeClothing(type)
                            }}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded p-1 hover:bg-destructive/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-4">
                          <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Upload {type.toLowerCase()}</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !bodyImage || clothingItems.length === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              "Generate Outfit"
            )}
          </Button>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[500px]">
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Your outfit preview</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center bg-muted/30 rounded-lg h-96">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="w-8 h-8 text-primary" />
                  <p className="text-muted-foreground">Creating your look...</p>
                </div>
              ) : resultImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={resultImage || "/placeholder.svg"}
                    alt="Generated outfit"
                    fill
                    className="object-contain"
                  />
                  {/* Download button overlay */}
                  <button
                    onClick={handleDownload}
                    className="absolute top-2 right-2 bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center px-4">
                  Upload your photo and clothing items, then click Generate Outfit to see the preview
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
