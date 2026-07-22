'use client';

import { useEffect, useState } from 'react';
import { BrutalCard, BrutalBadge } from '@/components/NeoBrutalistUI';
import { ArrowLeft, FileImage, Download } from 'lucide-react';
import Link from 'next/link';
import { downloadImage } from '@/lib/fs';

interface HasilFile {
  name: string;
  size: number;
  url: string;
}

export default function HasilPage() {
  const [files, setFiles] = useState<HasilFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/list-hasil')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFiles(data))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/"
        className="flex items-center gap-1 text-xs font-mono underline underline-offset-4 w-fit"
      >
        <ArrowLeft size={14} /> Back to Generator
      </Link>

      <h2 className="text-lg font-bold font-ui tracking-tight">
        <span className="bg-[var(--fg)] text-[var(--bg)] px-2 py-0.5">/hasil/</span>
      </h2>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-[var(--border-w)] border-[var(--border)] animate-pulse" />
        </div>
      )}

      {!loading && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FileImage size={40} className="text-[var(--muted)]" />
          <span className="text-sm font-mono">Belum ada file di /hasil/</span>
          <span className="text-xs text-[var(--muted)]">
            Generate gambar dan simpan, nanti muncul di sini
          </span>
        </div>
      )}

      <div className="brutal-grid cols-auto">
        {files.map((f) => (
          <BrutalCard key={f.name} noPad>
            <img
              src={f.url}
              alt={f.name}
              className="w-full h-40 object-cover border-b-[var(--border-w)] border-[var(--border)]"
              loading="lazy"
            />
            <div className="p-2 flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono truncate">{f.name}</p>
                <p className="text-[10px] text-[var(--muted)]">
                  {(f.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => downloadImage(f.url, f.name)}
                className="brutal-btn !p-1.5 !shadow-[3px_3px_0_var(--shadow)]"
                title="Download"
              >
                <Download size={14} />
              </button>
            </div>
          </BrutalCard>
        ))}
      </div>
    </div>
  );
}