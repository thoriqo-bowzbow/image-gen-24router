'use client';

import { useCallback } from 'react';
import { BrutalSlider, BrutalInput, BrutalSelect } from '@/components/NeoBrutalistUI';
import type { DefaultParams } from '@/lib/models';
import { Dice1 } from 'lucide-react';

interface ParamPanelProps {
  params: DefaultParams;
  onChange: (params: DefaultParams) => void;
}

const SIZES = ['512x512', '768x768', '1024x1024', '1024x768', '768x1024', '1024x576', '576x1024'];

export function ParamPanel({ params, onChange }: ParamPanelProps) {
  const update = useCallback(
    <K extends keyof DefaultParams>(key: K, value: DefaultParams[K]) => {
      onChange({ ...params, [key]: value });
    },
    [params, onChange]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="brutal-grid cols-2">
        <BrutalSelect
          label="Image Size"
          options={SIZES.map((s) => ({ value: s, label: s }))}
          value={String(params.image_size || '1024x1024')}
          onChange={(e) => update('image_size', e.target.value)}
        />

        <BrutalSelect
          label="Batch Size"
          options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n} image${n > 1 ? 's' : ''}` }))}
          value={String(params.batch_size || 1)}
          onChange={(e) => update('batch_size', Number(e.target.value))}
        />
      </div>

      <BrutalSlider
        label="Steps"
        min={1}
        max={50}
        step={1}
        value={Number(params.num_inference_steps ?? 4)}
        onChange={(e) => update('num_inference_steps', Number(e.target.value))}
        displayValue={String(params.num_inference_steps ?? 4)}
      />

      <BrutalSlider
        label="Guidance Scale (CFG)"
        min={0}
        max={20}
        step={0.5}
        value={Number(params.guidance_scale ?? 3.5)}
        onChange={(e) => update('guidance_scale', Number(e.target.value))}
        displayValue={String(params.guidance_scale ?? 3.5)}
      />

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <BrutalInput
            label="Seed (-1 = random)"
            type="number"
            value={String(params.seed ?? -1)}
            onChange={(e) => update('seed', Number(e.target.value))}
          />
        </div>
        <button
          onClick={() => update('seed', Math.floor(Math.random() * 999999999))}
          className="brutal-btn !p-2"
          title="Random seed"
        >
          <Dice1 size={16} />
        </button>
      </div>

      <BrutalInput
        label="Negative Prompt"
        value={String(params.negative_prompt ?? '')}
        onChange={(e) => update('negative_prompt', e.target.value)}
        placeholder="Apa yang TIDAK ingin muncul..."
      />
    </div>
  );
}
