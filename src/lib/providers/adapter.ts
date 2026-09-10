import type { ImageGenerateParams, GenerateResponse } from '@/lib/api';
import type { ProviderConfig } from './types';
import { openAICompatibleAdapter } from './openaiCompatible';
import { googleGeminiAdapter } from './gemini';
import { cloudflareWorkersAiAdapter } from './cloudflare';

export class ProviderUpstreamError extends Error {
  constructor(
    message: string,
    public readonly upstreamStatus?: number
  ) {
    super(message);
    this.name = 'ProviderUpstreamError';
  }
}

export interface ImageProviderAdapter {
  generate(config: ProviderConfig, params: ImageGenerateParams): Promise<GenerateResponse>;
}

const ADAPTERS: Record<string, ImageProviderAdapter> = {
  'openai-compatible': openAICompatibleAdapter,
  'google-gemini': googleGeminiAdapter,
  'cloudflare-workers-ai': cloudflareWorkersAiAdapter,
};

export function getAdapter(config: ProviderConfig): ImageProviderAdapter {
  const adapter = ADAPTERS[config.protocol || 'openai-compatible'];
  if (!adapter) {
    throw new ProviderUpstreamError(`Protokol provider tidak dikenal: ${config.protocol}`);
  }
  return adapter;
}

export function resolveApiKey(config: ProviderConfig): string {
  return config.apiKey || process.env.T2I_API_KEY || '';
}
