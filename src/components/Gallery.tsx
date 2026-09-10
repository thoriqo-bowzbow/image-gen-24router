'use client';

import { useMemo, useState } from 'react';
import { BrutalCard, BrutalInput, BrutalButton, BrutalBadge } from '@/components/NeoBrutalistUI';
import { useGallery } from '@/hooks/useGallery';
import { Trash2, RotateCcw, Download, ImageIcon } from 'lucide-react';
import { downloadImage } from '@/lib/fs';
import { modelShortName } from '@/lib/models';

interface GalleryProps {
  onReRun: (entry: {
    prompt: string;
    enhancedPrompt: string;
    model: string;
    params: Record<string, unknown>;
  }) => void;
}

export function Gallery({ onReRun }: GalleryProps) {
  const { entries, loading, remove, clear } = useGallery();
  const [search, setSearch] = useState('');
  const [filterModel, setFilterModel] = useState('');

  const models = useMemo(() => {
    const s = new Set(entries.map((e) => e.model));
    return Array.from(s).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (search && !e.prompt.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterModel && e.model !== filterModel) return false;
      return true;
    });
  }, [entries, search, filterModel]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-[var(--border-w)] border-[var(--border)] animate-pulse" />
        <span className="text-sm font-mono">Loading gallery...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ImageIcon size={48} className="text-[var(--muted)]" />
        <span className="text-sm font-mono">Belum ada gambar tersimpan</span>
        <span className="text-xs text-[var(--muted)]">
          Generate gambar dulu, nanti otomatis tersimpan di sini
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold font-ui">
          Gallery ({filtered.length}/{entries.length})
        </span>
        <BrutalButton size="sm" variant="ghost" onClick={clear}>
          <Trash2 size={14} /> Clear All
        </BrutalButton>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <BrutalInput
            placeholder="Cari prompt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="brutal-select w-auto"
          value={filterModel}
          onChange={(e) => setFilterModel(e.target.value)}
        >
          <option value="">Semua model</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {modelShortName(m)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-sm text-[var(--muted)]">Tidak ada hasil</div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((entry) => (
          <BrutalCard key={entry.id}>
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{entry.prompt}</p>
                  {entry.enhancedPrompt && entry.enhancedPrompt !== entry.prompt && (
                    <p className="text-xs text-[var(--muted)] truncate mt-1">
                      enhanced: {entry.enhancedPrompt}
                    </p>
                  )}
                </div>
                <BrutalBadge variant="outline">{modelShortName(entry.model)}</BrutalBadge>
              </div>

              {entry.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {entry.images.map((img, idx) => (
                    <div key={idx} className="relative group flex-shrink-0">
                      <img
                        src={img.thumbnail || img.url}
                        alt={`img ${idx + 1}`}
                        className="w-20 h-20 object-cover border-2 border-[var(--border)]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1">
                        <button
                          onClick={() => downloadImage(img.url, `${entry.id}_${idx}.webp`)}
                          className="brutal-btn !p-1 !shadow-[2px_2px_0_var(--shadow)] opacity-0 group-hover:opacity-100"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          onClick={() =>
                            onReRun({
                              prompt: entry.prompt,
                              enhancedPrompt: entry.enhancedPrompt,
                              model: entry.model,
                              params: entry.params,
                            })
                          }
                          className="brutal-btn !p-1 !shadow-[2px_2px_0_var(--shadow)] opacity-0 group-hover:opacity-100"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--muted)]">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => remove(entry.id)}
                  className="text-[10px] underline underline-offset-4 text-[var(--muted)] hover:text-[var(--accent)]"
                >
                  hapus
                </button>
              </div>
            </div>
          </BrutalCard>
        ))}
      </div>
    </div>
  );
}