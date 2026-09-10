import type { ModelInfo } from '@/lib/api';

export type ProviderProtocol = 'openai-compatible';

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  protocol: ProviderProtocol;
  apiKey?: string;
  enhanceModel?: string;
  models: ModelInfo[];
}

export interface ProvidersFile {
  activeProviderId: string | null;
  providers: ProviderConfig[];
}

export interface ProviderSummary extends Omit<ProviderConfig, 'apiKey'> {
  hasApiKey: boolean;
}

export function toSummary(p: ProviderConfig): ProviderSummary {
  const { apiKey, ...rest } = p;
  return { ...rest, hasApiKey: Boolean(apiKey) };
}
