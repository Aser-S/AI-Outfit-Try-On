# 👗 Outfit Try-On App

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/mohamedgamalledu-9954s-projects/v0-outfit-try-on-app)

A web app for virtually trying on outfits: upload a photo, enter your measurements, and see AI-generated looks on a mannequin built from your body shape.

## ✨ Features

- 📤 Upload a photo and add your measurements
- 🧍 AI-generated **mannequin** (`/api/generate-mannequin`)
- 👚 AI-generated **outfit try-on** (`/api/generate-outfit`)
- 🎨 Responsive UI with shadcn/ui components

## 🧱 Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Vercel AI SDK · Google Gemini · built with v0

## 🚀 Getting started

```bash
git clone https://github.com/Aser-S/AI-Outfit-Try-On.git
cd AI-Outfit-Try-On
pnpm install
# add your Gemini API key to .env.local
pnpm dev
```

Open http://localhost:3000.
