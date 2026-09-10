'use client';

import { BrutalSelect, BrutalBadge } from '@/components/NeoBrutalistUI';
import type { ModelInfo } from '@/lib/api';
import { groupByProvider, modelShortName } from '@/lib/models';
import { RefreshCw } from 'lucide-react';

interface ModelSelectorProps {
  models: ModelInfo[];
  selected: string;
  onSelect: (modelId: string, model: ModelInfo) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function ModelSelector({
  models,
  selected,
  onSelect,
  loading,
  onRefresh,
}: ModelSelectorProps) {
  const groups = groupByProvider(models);

  const options = models.map((m) => ({
    value: m.id,
    label: `${m.owned_by || 'unknown'} / ${modelShortName(m.id)}`,
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider">Model</span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-mono underline underline-offset-4 hover:text-[var(--accent)] disabled:opacity-40 flex items-center gap-1"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'loading...' : 'refresh'}
        </button>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <BrutalSelect
            options={options}
            value={selected}
            onChange={(e) => {
              const m = models.find((x) => x.id === e.target.value);
              if (m) onSelect(e.target.value, m);
            }}
            placeholder="Pilih model..."
          />
        </div>
      </div>
      {models.length === 0 && !loading && (
        <p className="text-xs text-[var(--muted)]">Tidak ada model. Tambahkan model provider di halaman Settings.</p>
      )}
    </div>
  );
}