"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Sparkles, Upload, Ruler } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 relative">
              <Image src="/images/logo.png" alt="Style Snap" width={40} height={40} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-primary hidden sm:inline">Style Snap</span>
          </div>
          <Link href="/try-on">
            <Button className="gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              See How You Look in Any Outfit
            </h1>
            <p className="text-xl text-muted-foreground">
              Mix and match clothing pieces using AI-powered virtual try-on. Upload your photo or share your
              measurements to get started.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/try-on">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Try It Now
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 grid md:grid-cols-2 gap-8">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Photo Mode</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Upload a full-body photo of yourself and instantly see how different clothing combinations look on you.
              Perfect for trying before you buy.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Ruler className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Measurement Mode</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">
              Enter your height, weight, and sizing details to generate a personalized mannequin that matches your body
              type and proportions.
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 bg-primary/5 rounded-2xl text-center space-y-6 mb-20">
        <h2 className="text-3xl font-bold">Ready to Transform Your Style?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get instant visual feedback on outfit combinations and make confident fashion choices.
        </p>
        <Link href="/try-on">
          <Button size="lg" className="gap-2">
            Start Styling <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </div>
  )
}
