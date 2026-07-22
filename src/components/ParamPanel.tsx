'use client';

import { useCallback } from 'react';
import { BrutalSlider, BrutalInput, BrutalSelect } from '@/components/NeoBrutalistUI';
import type { ModelInfo } from '@/lib/api';
import type { DefaultParams } from '@/lib/models';
import { Dice1 } from 'lucide-react';

interface ParamPanelProps {
  model: ModelInfo | null;
  params: DefaultParams;
  onChange: (params: DefaultParams) => void;
}

export function ParamPanel({ model, params, onChange }: ParamPanelProps) {
  const update = useCallback(
    <K extends keyof DefaultParams>(key: K, value: DefaultParams[K]) => {
      onChange({ ...params, [key]: value });
    },
    [params, onChange]
  );

  if (!model) return null;

  const sizes = ['512x512', '768x768', '1024x1024', '1024x768', '768x1024', '1024x576', '576x1024'];

  return (
    <div className="flex flex-col gap-4">
      <hr className="brutal-divider" />
      <span className="text-xs font-bold uppercase tracking-wider">Parameters</span>

      <div className="brutal-grid cols-2">
        <BrutalSelect
          label="Image Size"
          options={sizes.map((s) => ({ value: s, label: s }))}
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
        min={model.step_range?.[0] ?? 1}
        max={model.step_range?.[1] ?? 50}
        step={1}
        value={Number(params.num_inference_steps ?? 4)}
        onChange={(e) => update('num_inference_steps', Number(e.target.value))}
        displayValue={String(params.num_inference_steps ?? 4)}
      />

      <BrutalSlider
        label="Guidance Scale (CFG)"
        min={model.cfg_range?.[0] ?? 0}
        max={model.cfg_range?.[1] ?? 20}
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

      {model.style_presets && model.style_presets.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider">Style Preset</span>
          <div className="flex flex-wrap gap-1">
            {model.style_presets.map((style) => (
              <button
                key={style}
                onClick={() => update('style_preset', style === params.style_preset ? '' : style)}
                className={`brutal-badge cursor-pointer ${
                  params.style_preset === style ? 'accent' : 'outline'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}