import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import {
  Quicksand as V0_Font_Quicksand,
  Geist_Mono as V0_Font_Geist_Mono,
  EB_Garamond as V0_Font_EB_Garamond,
} from "next/font/google"

// Initialize fonts
const _quicksand = V0_Font_Quicksand({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })
const _geistMono = V0_Font_Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})
const _ebGaramond = V0_Font_EB_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })

export const metadata: Metadata = {
  title: "Style Snap - AI Outfit Try-On",
  description:
    "See how clothes look on you before buying. Upload your photo or measurements and mix & match outfits with our AI-powered try-on technology.",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
