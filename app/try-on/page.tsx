"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import PhotoMode from "@/components/photo-mode"
import MeasurementMode from "@/components/measurement-mode"

export default function TryOnPage() {
  const [mode, setMode] = useState<"selection" | "photo" | "measurement">("selection")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Style Snap Try-On</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {mode === "selection" && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-2">How would you like to start?</h2>
              <p className="text-lg text-muted-foreground">
                Choose your preferred way to set up your virtual style profile
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Photo Mode Card */}
              <button onClick={() => setMode("photo")} className="group">
                <Card className="h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 mb-4 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <span className="text-2xl">📸</span>
                    </div>
                    <CardTitle className="text-2xl">Photo Mode</CardTitle>
                    <CardDescription>Use your own photo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Upload a clear full-body photo of yourself wearing fitted clothing. The more clear and frontal
                      your photo, the better the results.
                    </p>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>✓ Upload your photo</li>
                      <li>✓ Add clothing pieces</li>
                      <li>✓ See yourself in the outfit</li>
                    </ul>
                  </CardContent>
                </Card>
              </button>

              {/* Measurement Mode Card */}
              <button onClick={() => setMode("measurement")} className="group">
                <Card className="h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 mb-4 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <span className="text-2xl">📏</span>
                    </div>
                    <CardTitle className="text-2xl">Measurement Mode</CardTitle>
                    <CardDescription>Create a custom mannequin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter your body measurements to generate a personalized mannequin. Perfect if you don't have a
                      photo handy.
                    </p>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>✓ Enter measurements</li>
                      <li>✓ Generate mannequin</li>
                      <li>✓ Mix and match outfits</li>
                      <li>✓ Get your tape measures ready!</li>
                    </ul>
                  </CardContent>
                </Card>
              </button>
            </div>
          </div>
        )}

        {mode === "photo" && <PhotoMode onBack={() => setMode("selection")} />}
        {mode === "measurement" && <MeasurementMode onBack={() => setMode("selection")} />}
      </div>
    </div>
  )
}
