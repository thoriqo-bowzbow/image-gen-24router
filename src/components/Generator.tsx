'use client';

import { useState, useCallback, useRef } from 'react';
import { BrutalTextarea, BrutalButton } from '@/components/NeoBrutalistUI';
import { ModelSelector } from '@/components/ModelSelector';
import { ParamPanel } from '@/components/ParamPanel';
import { PromptEnhancer } from '@/components/PromptEnhancer';
import { ImageGrid } from '@/components/ImageGrid';
import { useModels } from '@/hooks/useModels';
import { useGeneration } from '@/hooks/useGeneration';
import { useGallery } from '@/hooks/useGallery';
import { getDefaultParams, providerName } from '@/lib/models';
import type { DefaultParams } from '@/lib/models';

import { Wand2, Loader2, AlertCircle } from 'lucide-react';
import type { ModelInfo } from '@/lib/api';

export function Generator() {
  const { models, loading: modelsLoading, refresh: refreshModels } = useModels();
  const gen = useGeneration();
  const gallery = useGallery();
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedModelInfo, setSelectedModelInfo] = useState<ModelInfo | null>(null);
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [params, setParams] = useState<DefaultParams>(getDefaultParams({ id: '', owned_by: '', object: '' }));

  const handleModelSelect = useCallback((modelId: string, info: ModelInfo) => {
    setSelectedModel(modelId);
    setSelectedModelInfo(info);
    setParams(getDefaultParams(info));
  }, []);

  const handleGenerate = useCallback(async () => {
    const finalPrompt = enhancedPrompt || prompt;
    if (!finalPrompt.trim() || !selectedModel) return;

    await gen.generate({
      model: selectedModel,
      prompt: finalPrompt,
      ...params,
    });
  }, [enhancedPrompt, prompt, selectedModel, gen, params]);

  const handleReRun = useCallback(
    (data: { prompt: string; enhancedPrompt: string; model: string; params: DefaultParams }) => {
      setPrompt(data.prompt);
      setEnhancedPrompt(data.enhancedPrompt);
      setSelectedModel(data.model);
      setParams(data.params);
      const mi = models.find((m) => m.id === data.model);
      if (mi) setSelectedModelInfo(mi);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [models]
  );

  const handleSaveToGallery = useCallback(async () => {
    if (!gen.result) return;
    const images = gen.result.data.map((img) => ({
      url: img.url,
      thumbnail: img.b64_json
        ? `data:image/webp;base64,${img.b64_json}`
        : img.url,
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
  }, [gen.result, prompt, enhancedPrompt, selectedModel, params, gallery]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-ui tracking-tight mb-1">
          <span className="bg-[var(--fg)] text-[var(--bg)] px-2 py-1">TEXT → IMAGE</span>
        </h1>
        <p className="text-xs text-[var(--muted)] font-mono">
          Generate via 24Router • Neo-Brutalist • Anti-AI-Slop
        </p>
      </div>

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

      {selectedModelInfo && (
        <ParamPanel model={selectedModelInfo} params={params} onChange={setParams} />
      )}

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
          <BrutalButton size="sm" onClick={handleSaveToGallery}>
            Simpan ke Gallery
          </BrutalButton>
        </>
      )}
    </div>
  );
}