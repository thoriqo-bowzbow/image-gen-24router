'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BrutalTextarea, BrutalButton } from '@/components/NeoBrutalistUI';
import { ModelSelector } from '@/components/ModelSelector';
import { ParamPanel } from '@/components/ParamPanel';
import { PromptEnhancer } from '@/components/PromptEnhancer';
import { ImageGrid } from '@/components/ImageGrid';
import { useModels } from '@/hooks/useModels';
import { useGeneration } from '@/hooks/useGeneration';
import { useGallery } from '@/hooks/useGallery';
import { getDefaultParams, providerName } from '@/lib/models';
import { imageDataUrl } from '@/lib/api';
import type { DefaultParams } from '@/lib/models';

import { Wand2, Loader2, AlertCircle } from 'lucide-react';

export function Generator() {
  const { models, loading: modelsLoading, error: modelsError, refresh: refreshModels } = useModels();
  const gen = useGeneration();
  const gallery = useGallery();
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [paramsOverride, setParamsOverride] = useState<DefaultParams | null>(null);
  const [paramMode, setParamMode] = useState<'best' | 'advanced'>('best');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [genStart, setGenStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Timer berjalan selama generation berlangsung (indikator progress)
  useEffect(() => {
    if (gen.status !== 'loading' || genStart === null) return;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - genStart) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [gen.status, genStart]);

  // Turunkan dari daftar model — otomatis memilih model pertama saat daftar termuat
  const activeModel = models.find((m) => m.id === selectedModelId) ?? models[0] ?? null;
  const selectedModel = activeModel?.id ?? '';
  const params = paramsOverride ?? getDefaultParams();

  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setParamsOverride(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    const finalPrompt = enhancedPrompt || prompt;
    if (!finalPrompt.trim() || !selectedModel) return;

    setGenStart(Date.now());
    setElapsed(0);
    if (paramMode === 'best') {
      await gen.generate({ model: selectedModel, prompt: finalPrompt });
    } else {
      await gen.generate({
        model: selectedModel,
        prompt: finalPrompt,
        ...params,
      });
    }
  }, [enhancedPrompt, prompt, selectedModel, gen, params, paramMode]);

  const handleSaveToGallery = useCallback(async () => {
    if (!gen.result) return;
    setSaveState('saving');
    try {
      const images = gen.result.data.map((img) => ({
        url: img.url,
        thumbnail: imageDataUrl(img),
      }));
      await gallery.save({
        id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        prompt,
        enhancedPrompt: enhancedPrompt || prompt,
        model: selectedModel,
        provider: providerName(selectedModel),
        params: { ...params },
        images,
        timestamp: Date.now(),
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [gen.result, prompt, enhancedPrompt, selectedModel, params, gallery]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-ui tracking-tight mb-1">
          <span className="bg-[var(--fg)] text-[var(--bg)] px-2 py-1">TEXT → IMAGE</span>
        </h1>
        <p className="text-xs text-[var(--muted)] font-mono">
          OpenAI-compatible • Multi-provider • Neo-Brutalist
        </p>
      </div>

      {!modelsLoading && models.length === 0 && (
        <div className="brutal-card !border-[var(--accent)] flex items-start gap-2" role="alert">
          <AlertCircle size={16} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Belum siap generate</p>
            <p className="text-xs text-[var(--muted)]">
              {modelsError || 'Tidak ada model tersedia.'}{' '}
              <a href="/settings" className="underline underline-offset-2 font-bold">
                Buka Settings →
              </a>
            </p>
          </div>
        </div>
      )}

      <ModelSelector
        models={models}
        selected={selectedModel}
        onSelect={handleModelSelect}
        loading={modelsLoading}
        onRefresh={refreshModels}
      />

      <div className="flex flex-col gap-2">
        <BrutalTextarea
          ref={promptRef}
          label="Prompt"
          placeholder="Deskripsikan gambar yang kamu inginkan..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px]"
        />
        <PromptEnhancer
          originalPrompt={prompt}
          onEnhanced={setEnhancedPrompt}
          disabled={gen.status === 'loading' || gen.status === 'enhancing'}
        />
      </div>

      <div className="flex flex-col gap-3">
        <hr className="brutal-divider" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider mr-1">Kualitas</span>
          <BrutalButton
            size="sm"
            variant={paramMode === 'best' ? 'accent' : 'default'}
            onClick={() => setParamMode('best')}
          >
            Terbaik
          </BrutalButton>
          <BrutalButton
            size="sm"
            variant={paramMode === 'advanced' ? 'accent' : 'default'}
            onClick={() => setParamMode('advanced')}
          >
            Advanced
          </BrutalButton>
        </div>
        {paramMode === 'best' ? (
          <p className="text-xs text-[var(--muted)] font-mono">
            Pengaturan optimal bawaan model dipakai otomatis — tinggal tulis prompt dan generate.
          </p>
        ) : (
          activeModel && <ParamPanel params={params} onChange={setParamsOverride} />
        )}
      </div>

      <BrutalButton
        variant="accent"
        size="lg"
        onClick={handleGenerate}
        disabled={gen.status === 'loading' || gen.status === 'enhancing' || !selectedModel || !prompt.trim()}
        className="w-full justify-center"
      >
        {gen.status === 'loading' || gen.status === 'enhancing' ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {gen.progress}
            {elapsed > 0 ? ` • ${elapsed}s` : ''}
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Generate{enhancedPrompt ? ' (enhanced)' : ''}
          </>
        )}
      </BrutalButton>

      {gen.status === 'error' && (
        <div className="brutal-card !border-[var(--accent)] flex items-start gap-2" role="alert">
          <AlertCircle size={16} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Generation Failed</p>
            <p className="text-xs text-[var(--muted)]">{gen.error}</p>
          </div>
        </div>
      )}

      {gen.status === 'success' && gen.result && (
        <>
          <ImageGrid
            images={gen.result.data}
            modelName={selectedModel}
            seed={Number(params.seed) || undefined}
            onReRun={undefined}
            onDelete={undefined}
          />
          <div className="flex items-center gap-3">
            <BrutalButton size="sm" onClick={handleSaveToGallery} disabled={saveState === 'saving'}>
              {saveState === 'saving' ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                'Simpan ke Gallery'
              )}
            </BrutalButton>
            {saveState === 'saved' && (
              <span className="text-xs font-mono text-[var(--fg)]">Tersimpan ke gallery ✓</span>
            )}
            {saveState === 'error' && (
              <span className="text-xs font-mono text-[var(--accent)]">Gagal menyimpan — coba lagi</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
