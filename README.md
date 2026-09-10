# Image Gen Multi-Provider

Generator gambar text-to-image berbasis web dengan desain Neo-Brutalist. Mendukung AI provider OpenAI-compatible apa saja — provider dan daftar model diatur langsung dari UI, tanpa perlu mengubah kode.

## Fitur

- Provider AI apa saja yang OpenAI-compatible (`/v1/images/generations`, `/v1/chat/completions`)
- Kelola provider + daftar model lewat halaman `/settings` (tersimpan di `data/providers.json`)
- Test koneksi provider langsung dari UI
- Prompt enhancer via chat model (opsional, per provider)
- Gallery dengan IndexedDB + file fisik
- Desain Neo-Brutalist CSS-first

## Tech Stack

- Next.js 16 (standalone mode)
- Tailwind CSS 4
- Arsitektur provider adapter (`src/lib/providers/`)

## Setup

1. `npm install --include=dev`
2. `npm run build`
3. Buka halaman `/settings`, tambahkan provider (base URL + API key), tambahkan model image-nya manual, lalu jadikan aktif
4. Deploy produksi: `cp -r .next/static .next/standalone/.next/` lalu `node .next/standalone/server.js`

## Konfigurasi

- Provider & model: kelola via UI di `/settings` — tersimpan di `data/providers.json` (di-gitignore karena berisi API key)
- `T2I_API_KEY` (opsional) — fallback API key jika provider aktif tidak punya API key sendiri

## Menambah Provider Baru (kode)

Semua panggilan upstream melewati adapter di `src/lib/providers/`. Untuk protokol non-OpenAI-compatible, buat adapter baru (implementasi `ImageProviderAdapter`) dan daftarkan di registry `src/lib/providers/adapter.ts`.
