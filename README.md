# Image Gen 24Router

Generator gambar text-to-image berbasis web dengan desain Neo-Brutalist.

## Fitur

- 11 model image dari Cloudflare Workers AI (FLUX, SDXL, DreamShaper, dll)
- Prompt enhancer via AI combo model
- Gallery dengan IndexedDB + file fisik
- Desain Neo-Brutalist CSS-first

## Tech Stack

- Next.js 16 (standalone mode)
- Tailwind CSS 4
- 24Router sebagai backend API
- Cloudflare Workers AI

## Setup

1. Copy `.env.example` → `.env.local`, isi API key 24Router
2. `npm install && npm run build`
3. Copy standalone: `cp -r .next/static .next/standalone/.next/`
4. Jalankan: `node .next/standalone/server.js`

## Environment Variables

- `T2I_API_KEY` — API key untuk autentikasi ke 24Router
