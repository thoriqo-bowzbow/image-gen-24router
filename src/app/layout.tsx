import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Text-to-Image • Neo-Brutalist",
  description: "Generate gambar dengan AI provider apa saja (OpenAI-compatible)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scanlines">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <header className="border-b-[var(--border-w)] border-[var(--border)] bg-[var(--surface)]">
          <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold font-ui text-lg tracking-tight">
              T2I<span className="text-[var(--accent)]">:</span>BRUTAL
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-mono underline underline-offset-4"
              >
                Generate
              </Link>
              <Link
                href="/gallery"
                className="text-sm font-mono underline underline-offset-4"
              >
                Gallery
              </Link>
              <Link
                href="/settings"
                className="text-sm font-mono underline underline-offset-4"
              >
                Settings
              </Link>
              <Link
                href="/docs"
                className="text-sm font-mono underline underline-offset-4"
              >
                Docs
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}