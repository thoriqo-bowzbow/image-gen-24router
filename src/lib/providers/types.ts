import type { ModelInfo } from '@/lib/api';

export type ProviderProtocol = 'openai-compatible' | 'google-gemini' | 'cloudflare-workers-ai';

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  protocol: ProviderProtocol;
  apiKey?: string;
  accountId?: string;
  enhanceModel?: string;
  models: ModelInfo[];
}

export interface ProvidersFile {
  activeProviderId: string | null;
  // Konfigurasi khusus prompt enhancer (bisa beda provider dari image generator)
  enhanceProviderId: string | null;
  enhanceModelId: string | null;
  providers: ProviderConfig[];
}

export interface EnhanceConfig {
  providerId: string | null;
  model: string | null;
}

export interface ProviderSummary extends Omit<ProviderConfig, 'apiKey'> {
  hasApiKey: boolean;
}

export function toSummary(p: ProviderConfig): ProviderSummary {
  const { apiKey, ...rest } = p;
  return { ...rest, hasApiKey: Boolean(apiKey) };
}
