"use client"

import React from "react"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel, FieldDescription, FieldGroup, FieldSet } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ChevronLeft, Upload, X, AlertCircle, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateImageFile, optimizeImage } from "@/lib/image-utils"
import { createCollage, buildMannequinOutfitPrompt } from "@/lib/collage-utils"

interface MeasurementModeProps {
  onBack: () => void
}

interface Measurements {
  height: string
  gender: "female" | "male" | "other"
  chest: string
  waist: string
  hip: string
  legHeight: string
  shoulderWidth: string
  isHijabi: boolean
}

export default function MeasurementMode({ onBack }: MeasurementModeProps) {
  const [measurements, setMeasurements] = useState<Measurements>({
    height: "",
    gender: "female",
    chest: "",
    waist: "",
    hip: "",
    legHeight: "",
    shoulderWidth: "",
    isHijabi: false,
  })
  const [clothingItems, setClothingItems] = useState<{ type: string; file: File; preview: string }[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add debugging when component loads
  React.useEffect(() => {
    console.log("[MEASUREMENT-MODE] Component loaded - Measurement Mode initialized")
    console.log("[MEASUREMENT-MODE] API endpoint available at: /api/generate-outfit")
    console.log("[MEASUREMENT-MODE] Ready to accept measurements and clothing uploads")
  }, [])

  const handleInputChange = (field: string, value: string | boolean) => {
    console.log(`[MEASUREMENT-MODE] Input changed - field: ${field}, value: ${value}`)
    setMeasurements((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleClothingUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    console.log(`[MEASUREMENT-MODE] Clothing upload started for ${type}`)

    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.log(`[MEASUREMENT-MODE] ERROR: Validation failed - ${validation.error}`)
      setError(validation.error || "Invalid image")
      return
    }

    try {
      console.log(`[MEASUREMENT-MODE] Optimizing image for ${type}...`)
      const optimized = await optimizeImage(file)
      console.log(`[MEASUREMENT-MODE] Image optimized - size: ${optimized.size}B`)

      const optimizedFile = new File([optimized], file.name, { type: "image/jpeg" })
      const preview = URL.createObjectURL(optimized)
      setClothingItems((prev) => [...prev.filter((item) => item.type !== type), { type, file: optimizedFile, preview }])
      console.log(`[MEASUREMENT-MODE] ${type} added successfully`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      console.log(`[MEASUREMENT-MODE] ERROR: ${errorMsg}`)
      setError("Failed to process clothing image. Please try a different file.")
    }
  }

  const removeClothing = (type: string) => {
    console.log(`[MEASUREMENT-MODE] Removing ${type}`)
    setClothingItems((prev) => prev.filter((item) => item.type !== type))
  }

  const handleGenerate = async () => {
    setError(null)
    console.log("[MEASUREMENT-MODE] Generate clicked")

    if (!measurements.height) {
      setError("Height is required")
      console.log("[MEASUREMENT-MODE] ERROR: Height missing")
      return
    }

    if (!measurements.chest || !measurements.waist || !measurements.hip || !measurements.legHeight || !measurements.shoulderWidth) {
      setError("All measurements (chest, waist, hip, leg height, shoulder width) are required")
      console.log("[MEASUREMENT-MODE] ERROR: Missing measurements")
      return
    }

    if (clothingItems.length === 0) {
      setError("Please upload at least one clothing item")
      console.log("[MEASUREMENT-MODE] ERROR: No clothing items")
      return
    }

    const height = Number.parseFloat(measurements.height)

    if (Number.isNaN(height) || height <= 0) {
      setError("Height must be a valid positive number")
      console.log("[MEASUREMENT-MODE] ERROR: Invalid height")
      return
    }

    console.log(`[MEASUREMENT-MODE] All validations passed - measurements ready: height=${height}`)

    setIsGenerating(true)
    try {
      console.log("[MEASUREMENT-MODE] Creating collage...")
      const collageBlob = await createCollage(clothingItems.map((item) => ({ file: item.file, type: item.type })))
      const collageFile = new File([collageBlob], "clothing-collage.jpg", { type: "image/jpeg" })
      console.log(`[MEASUREMENT-MODE] Collage created - size: ${collageFile.size}B`)

      console.log("[MEASUREMENT-MODE] Building prompt...")
      const prompt = buildMannequinOutfitPrompt(
        measurements,
        clothingItems.map((item) => item.type),
      )
      console.log(`[MEASUREMENT-MODE] Prompt built - length: ${prompt.length}`)

      const formData = new FormData()
      formData.append("collage", collageFile)
      formData.append("prompt", prompt)
      formData.append("mode", "mannequin")
      formData.append("measurements", JSON.stringify(measurements))

      console.log("[MEASUREMENT-MODE] FormData prepared, sending to API...")
      const response = await fetch("/api/generate-outfit", {
        method: "POST",
        body: formData,
      })

      console.log(`[MEASUREMENT-MODE] API response status: ${response.status}`)

      if (!response.ok) {
        console.log("[MEASUREMENT-MODE] Parsing error response...")
        const errorData = await response.json().catch(() => {
          console.log("[MEASUREMENT-MODE] Could not parse error JSON")
          return {}
        })
        console.log(`[MEASUREMENT-MODE] ERROR: ${JSON.stringify(errorData)}`)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log("[MEASUREMENT-MODE] Parsing response blob...")
      const blob = await response.blob()
      console.log(`[MEASUREMENT-MODE] Blob received - size: ${blob.size}B`)

      const imageUrl = URL.createObjectURL(blob)
      setResultImage(imageUrl)
      console.log("[MEASUREMENT-MODE] Result set successfully")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate outfit"
      console.error("[MEASUREMENT-MODE] FATAL ERROR:", err)
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!resultImage) return

    try {
      console.log("[MEASUREMENT-MODE] Starting download...")
      const response = await fetch(resultImage)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mannequin-outfit-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log("[MEASUREMENT-MODE] Download completed")
    } catch (err) {
      console.error("[MEASUREMENT-MODE] Download failed:", err)
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
        <h2 className="text-2xl font-bold">Measurement Mode</h2>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Measurements Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Measurements</CardTitle>
              <CardDescription>All fields required for accurate fitting</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldGroup className="space-y-4">
                  {/* Measurement Guide */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">📏 Measurement Guide</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• <strong>Chest:</strong> Around fullest part of chest</li>
                      <li>• <strong>Waist:</strong> Around narrowest part of waist</li>
                      <li>• <strong>Hip:</strong> Around fullest part of hips</li>
                      <li>• <strong>Shoulder:</strong> From shoulder tip to tip</li>
                      <li>• <strong>Leg Height:</strong> From waist to floor</li>
                    </ul>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="height" className="text-xs">
                      Height (cm)
                    </FieldLabel>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={measurements.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                    />
                    <FieldDescription className="text-xs">Any height (kids welcome!)</FieldDescription>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="chest" className="text-xs">
                        Chest (cm)
                      </FieldLabel>
                      <Input
                        id="chest"
                        type="number"
                        placeholder="90"
                        value={measurements.chest}
                        onChange={(e) => handleInputChange("chest", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="waist" className="text-xs">
                        Waist (cm)
                      </FieldLabel>
                      <Input
                        id="waist"
                        type="number"
                        placeholder="75"
                        value={measurements.waist}
                        onChange={(e) => handleInputChange("waist", e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="hip" className="text-xs">
                        Hip (cm)
                      </FieldLabel>
                      <Input
                        id="hip"
                        type="number"
                        placeholder="95"
                        value={measurements.hip}
                        onChange={(e) => handleInputChange("hip", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="shoulderWidth" className="text-xs">
                        Shoulder Width (cm)
                      </FieldLabel>
                      <Input
                        id="shoulderWidth"
                        type="number"
                        placeholder="40"
                        value={measurements.shoulderWidth}
                        onChange={(e) => handleInputChange("shoulderWidth", e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="legHeight" className="text-xs">
                      Leg Height (cm)
                    </FieldLabel>
                    <Input
                      id="legHeight"
                      type="number"
                      placeholder="85"
                      value={measurements.legHeight}
                      onChange={(e) => handleInputChange("legHeight", e.target.value)}
                    />
                    <FieldDescription className="text-xs">From waist to floor</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="gender" className="text-xs">
                      Gender
                    </FieldLabel>
                    <Select value={measurements.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger id="gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {measurements.gender === "female" && (
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <input
                        id="isHijabi"
                        type="checkbox"
                        checked={measurements.isHijabi}
                        onChange={(e) => handleInputChange("isHijabi", e.target.checked)}
                        className="w-4 h-4 mt-1"
                      />
                      <label htmlFor="isHijabi" className="text-xs cursor-pointer">
                        I prefer hijab styling (modest fashion with hijab)
                      </label>
                    </div>
                  )}
                </FieldGroup>
              </FieldSet>
            </CardContent>
          </Card>

          {/* Clothing Items */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Clothing Items</CardTitle>
              <CardDescription>Add all pieces</CardDescription>
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
                    <div className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors">
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
                          <p className="text-xs text-muted-foreground">Upload</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="lg:col-span-1 min-h-[500px]">
            <CardHeader>
              <CardTitle className="text-lg">Result</CardTitle>
              <CardDescription>Outfit on mannequin</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center bg-muted/30 rounded-lg h-96">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="w-8 h-8 text-primary" />
                  <p className="text-sm text-muted-foreground">Generating...</p>
                </div>
              ) : resultImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={resultImage || "/placeholder.svg"}
                    alt="Outfit on mannequin"
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
                <p className="text-xs text-muted-foreground text-center px-3">
                  Fill measurements, add clothing, and generate
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !measurements.height || clothingItems.length === 0}
          className="w-full md:w-auto"
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
    </div>
  )
}
