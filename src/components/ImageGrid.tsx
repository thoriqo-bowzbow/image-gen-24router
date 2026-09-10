'use client';

import { useState } from 'react';
import { BrutalCard, BrutalBadge } from '@/components/NeoBrutalistUI';
import { Download, RotateCcw, Trash2, Maximize2 } from 'lucide-react';
import { downloadImage, generateFilename } from '@/lib/fs';
import { imageDataUrl, imageExt } from '@/lib/api';
import type { ImageResult } from '@/lib/api';

interface ImageGridProps {
  images: ImageResult[];
  modelName?: string;
  seed?: number;
  onReRun?: (image: ImageResult, index: number) => void;
  onDelete?: (index: number) => void;
}

export function ImageGrid({ images, modelName, seed, onReRun, onDelete }: ImageGridProps) {
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  if (!images.length) return null;

  const handleDownload = async (img: ImageResult, idx: number) => {
    setSaving((s) => ({ ...s, [idx]: true }));
    try {
      const url = imageDataUrl(img);
      const filename = generateFilename(modelName || 'image', imageExt(img));
      downloadImage(url, filename);
    } finally {
      setSaving((s) => ({ ...s, [idx]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="brutal-grid cols-auto">
        {images.map((img, idx) => (
          <BrutalCard key={idx} noPad className="flex flex-col">
            <div
              className="relative group cursor-pointer bg-black/5"
              onClick={() => setFullscreenIdx(idx)}
            >
              <img
                src={imageDataUrl(img)}
                alt={`Generated ${idx + 1}`}
                className="w-full h-auto object-cover border-b-[var(--border-w)] border-[var(--border)]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Maximize2 size={20} className="opacity-0 group-hover:opacity-100 text-white drop-shadow-md" />
              </div>
            </div>
            <div className="p-2 flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <button
                  onClick={() => handleDownload(img, idx)}
                  disabled={saving[idx]}
                  className="brutal-btn !p-1.5 !shadow-[3px_3px_0_var(--shadow)]"
                  title="Download"
                >
                  <Download size={14} />
                </button>
                {onReRun && (
                  <button
                    onClick={() => onReRun(img, idx)}
                    className="brutal-btn !p-1.5 !shadow-[3px_3px_0_var(--shadow)]"
                    title="Re-run with this"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(idx)}
                    className="brutal-btn !p-1.5 !shadow-[3px_3px_0_var(--shadow)]"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {seed !== undefined && (
                <BrutalBadge variant="outline">seed: {seed}</BrutalBadge>
              )}
            </div>
          </BrutalCard>
        ))}
      </div>

      {fullscreenIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullscreenIdx(null)}
        >
          <img
            src={imageDataUrl(images[fullscreenIdx])}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}