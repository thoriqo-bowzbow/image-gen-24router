import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "700", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ImageGen • Multi-Provider Text-to-Image",
  description: "Generate gambar dengan AI provider apa saja (OpenAI-compatible, Gemini, Cloudflare Workers AI)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`scanlines ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen">
        <header className="border-b-[var(--border-w)] border-[var(--border)] bg-[var(--surface)]">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold font-ui text-base sm:text-lg tracking-tight">
              T2I<span className="text-[var(--accent)]">:</span>BRUTAL
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/"
                className="text-xs sm:text-sm font-mono underline underline-offset-4"
              >
                Generate
              </Link>
              <Link
                href="/gallery"
                className="text-xs sm:text-sm font-mono underline underline-offset-4"
              >
                Gallery
              </Link>
              <Link
                href="/settings"
                className="text-xs sm:text-sm font-mono underline underline-offset-4"
              >
                Settings
              </Link>
              <Link
                href="/docs"
                className="text-xs sm:text-sm font-mono underline underline-offset-4"
              >
                Docs
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
