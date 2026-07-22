import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Text-to-Image • Neo-Brutalist",
  description: "Generate gambar via 24Router dengan full kustomisasi",
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
          <nav className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
            <a href="/" className="font-bold font-ui text-sm tracking-tight">
              T2I<span className="text-[var(--accent)]">:</span>BRUTAL
            </a>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-xs font-mono underline underline-offset-4"
              >
                Generate
              </a>
              <a
                href="/gallery"
                className="text-xs font-mono underline underline-offset-4"
              >
                Gallery
              </a>
              <a
                href="/hasil"
                className="text-xs font-mono underline underline-offset-4"
              >
                Files
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}