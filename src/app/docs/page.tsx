import type { Metadata } from 'next';
import { BrutalCard } from '@/components/NeoBrutalistUI';

export const metadata: Metadata = {
  title: 'Docs • ImageGen',
  description: 'Panduan penggunaan image-gen dari provider kosong sampai generate gambar',
};

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="brutal-badge accent !px-2.5 !py-1 h-fit flex-shrink-0 font-mono">{n}</span>
      <div className="flex flex-col gap-2 min-w-0">
        <h2 className="text-lg font-bold font-ui tracking-tight">{title}</h2>
        <div className="flex flex-col gap-2 text-sm">{children}</div>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[var(--muted)]/20 border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs break-all">
      {children}
    </code>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-ui tracking-tight mb-1">
          <span className="bg-[var(--fg)] text-[var(--bg)] px-2 py-1">DOCS</span>
        </h1>
        <p className="text-sm text-[var(--muted)] font-mono mt-1.5">
          Panduan penggunaan: dari provider kosong sampai berhasil generate gambar. Untuk instalasi &
          deploy, lihat README.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <Step n="1" title="Tambah Provider AI (di halaman Settings)">
          <p>
            Klik <strong>+ Tambah Provider</strong>, isi Nama Provider, pilih <strong>Protokol</strong>,
            lalu isi koneksi sesuai layanan yang kamu punya:
          </p>
          <BrutalCard>
            <p className="font-bold">OpenAI-compatible</p>
            <p className="text-[var(--muted)]">
              Untuk gateway/router pihak ketiga (Agnes AI, OpenRouter, vLLM, dll). Isi:
              <br />• <strong>Base URL</strong> — alamat API provider, mis. <Code>https://api.provider.com/v1</Code>
              <br />• <strong>API Key</strong> — key dari provider tersebut
            </p>
          </BrutalCard>
          <BrutalCard>
            <p className="font-bold">Google Gemini (Nano Banana)</p>
            <p className="text-[var(--muted)]">
              Tidak perlu Base URL — otomatis pakai endpoint resmi Google. Isi:
              <br />• <strong>API Key</strong> — buat gratis di{' '}
              <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                aistudio.google.com/apikey
              </a>
              <br />• Catatan: generate gambar (image model) butuh <strong>billing aktif</strong> di Google AI
              Studio. Tanpa billing, request gambar akan ditolak dengan error kuota (429). Fitur teks
              (prompt enhancer) tetap bisa gratis.
            </p>
          </BrutalCard>
          <BrutalCard>
            <p className="font-bold">Cloudflare Workers AI</p>
            <p className="text-[var(--muted)]">
              Tidak perlu Base URL — otomatis pakai endpoint resmi Cloudflare. Isi:
              <br />• <strong>Account ID</strong> — dashboard Cloudflare → Workers &amp; Pages → sidebar kanan
              <br />• <strong>API Token</strong> — My Profile → API Tokens → Create Token → permission{' '}
              <Code>Account → Workers AI → Edit</Code>
            </p>
          </BrutalCard>
          <p>
            Sebelum menyimpan, klik <strong>Test Koneksi</strong> untuk memastikan koneksi benar. Setelah
            oke, klik <strong>Simpan</strong>.
          </p>
        </Step>

        <Step n="2" title="Tambah Model Image">
          <p>
            Di kartu provider yang baru dibuat, klik tombol <strong>Model</strong> → <strong>+ Tambah Model</strong>.
            Cukup isi 3 hal:
          </p>
          <p>
            • <strong>Model ID</strong> — ID resmi model di provider itu (harus persis)
            <br />• <strong>Label</strong> — nama tampilan bebas
            <br />• <strong>Deskripsi</strong> — opsional, catatan kecil untukmu
          </p>
          <p>Contoh Model ID yang umum:</p>
          <p>
            • Cloudflare: <Code>@cf/black-forest-labs/flux-1-schnell</Code> (cepat) atau{' '}
            <Code>@cf/stabilityai/stable-diffusion-xl-base-1.0</Code>
            <br />• Gemini: <Code>gemini-2.5-flash-image</Code> (Nano Banana)
            <br />• OpenAI-compatible: lihat daftar model di provider kamu (mis.{' '}
            <Code>flux-schnell</Code>, <Code>sd3</Code>)
          </p>
        </Step>

        <Step n="3" title="Set Provider Aktif">
          <p>
            Di kartu provider, klik <strong>Jadikan Aktif</strong>. Provider aktif (kartu berborder merah,
            tombol berubah jadi <strong>AKTIF</strong>) adalah yang dipakai saat generate gambar.
          </p>
          <p>
            Bisa punya banyak provider sekaligus dan pindah-pindah kapan saja — model di halaman Generate
            otomatis mengikuti provider aktif.
          </p>
        </Step>

        <Step n="4" title="Atur Prompt Enhancer (opsional)">
          <p>
            Section <strong>PROMPT ENHANCER</strong> di atas Settings memakai AI teks untuk mengubah prompt
            pendekmu jadi prompt detail yang lebih bagus. Boleh beda provider dari image generator — contoh:
            enhance pakai Gemini, generate pakai Cloudflare.
          </p>
          <p>
            Isi <strong>Provider Enhance</strong> + <strong>Model Enhance</strong> (harus model{' '}
            <em>chat/teks</em>, bukan model image). Contoh: <Code>gemini-3.6-flash</Code> untuk Gemini,{' '}
            <Code>@cf/meta/llama-3.1-8b-instruct</Code> untuk Cloudflare. Klik <strong>Simpan Enhancer</strong>.
          </p>
          <p>
            Kosongkan pilihan provider enhance untuk mengikuti provider aktif. Kalau tidak diisi sama sekali,
            tombol Enhance di halaman Generate akan memberi tahu bahwa belum dikonfigurasi.
          </p>
        </Step>

        <Step n="5" title="Generate!">
          <p>Di halaman Generate:</p>
          <p>
            1. Pilih <strong>Model</strong> dari dropdown
            <br />
            2. Tulis <strong>Prompt</strong> (boleh pakai tombol <strong>Enhance Prompt</strong> bila sudah
            dikonfigurasi)
            <br />
            3. Pilih <strong>Kualitas</strong>:
          </p>
          <p>
            • <strong>Terbaik</strong> (default) — tanpa setelan, model memakai pengaturan optimalnya
            sendiri. Paling simpel.
            <br />• <strong>Advanced</strong> — atur sendiri image size, batch, steps, CFG, seed, dan
            negative prompt.
          </p>
          <p>
            4. Klik <strong>Generate</strong>. Hasil muncul di bawah — bisa di-download atau disimpan ke
            Gallery dengan tombol <strong>Simpan ke Gallery</strong>.
          </p>
        </Step>

        <Step n="6" title="Gallery">
          <p>
            Semua gambar yang kamu simpan tercatat di halaman <strong>Gallery</strong> (tersimpan di browser
            via IndexedDB). Dari sana kamu bisa mencari, membuka ulang prompt-nya, atau menghapus.
          </p>
        </Step>
      </div>

      <BrutalCard>
        <p className="font-bold mb-2">Masalah umum</p>
        <div className="flex flex-col gap-2 text-sm text-[var(--muted)]">
          <p>
            <strong className="text-[var(--fg)]">Error 429 kuota habis (Gemini)</strong> — image model Gemini
            butuh billing aktif; kuota free tier untuk image generation adalah 0.
          </p>
          <p>
            <strong className="text-[var(--fg)]">Error &quot;Additional properties not allowed&quot; (Cloudflare)</strong>{' '}
            — model tidak mendukung parameter tertentu; adapter otomatis membuangnya dan mencoba lagi. Kalau
            masih gagal, coba matikan Advanced mode (pakai Terbaik).
          </p>
          <p>
            <strong className="text-[var(--fg)]">Tombol Enhance error</strong> — isi section Prompt Enhancer
            di Settings, ingat harus model chat/teks, bukan model image.
          </p>
          <p>
            <strong className="text-[var(--fg)]">Model tidak muncul di halaman Generate</strong> — pastikan
            provider sudah aktif dan punya minimal 1 model (tombol refresh di dropdown model).
          </p>
        </div>
      </BrutalCard>
    </div>
  );
}
