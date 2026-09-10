import type { ProviderSummary, ProviderProtocol, EnhanceConfig } from '@/lib/providers/types';

export type { ProviderSummary, ProviderProtocol, EnhanceConfig };

export interface ModelInfo {
  id: string;
  object: string;
  owned_by: string;
  description?: string;
}

export interface ImageGenerateParams {
  model: string;
  prompt: string;
  negative_prompt?: string;
  image_size?: string;
  batch_size?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  style_preset?: string;
  [key: string]: unknown;
}

export interface ImageResult {
  url: string;
  revised_prompt?: string;
  b64_json?: string;
  mime_type?: string;
}

export function imageDataUrl(img: ImageResult): string {
  if (img.b64_json) return `data:${img.mime_type || 'image/webp'};base64,${img.b64_json}`;
  return img.url;
}

export function imageExt(img: ImageResult): string {
  if (!img.b64_json) return 'png';
  return (img.mime_type || 'image/webp').split('/')[1] || 'png';
}

export interface GenerateResponse {
  created: number;
  data: ImageResult[];
}

export interface ProviderInputPayload {
  name?: string;
  baseUrl?: string;
  protocol?: ProviderProtocol;
  apiKey?: string;
  accountId?: string;
  enhanceModel?: string;
  models?: ModelInfo[];
  setActive?: boolean;
}

export interface TestResult {
  ok: boolean;
  status?: number;
  message: string;
}

interface ProvidersListResponse {
  activeProviderId: string | null;
  enhance: EnhanceConfig;
  providers: ProviderSummary[];
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${message.slice(0, 300)}`);
  }
  return res.json();
}

export async function generateImage(params: ImageGenerateParams): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>('/api/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function enhancePrompt(prompt: string): Promise<string> {
  const res = await fetch('/api/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : `Enhance failed: ${res.status}`;
    throw new Error(message);
  }
  const data = await res.json();
  return data.enhanced;
}

export const providersApi = {
  async list(): Promise<ProvidersListResponse> {
    return apiFetch<ProvidersListResponse>('/api/providers');
  },

  async create(input: ProviderInputPayload): Promise<ProviderSummary> {
    const data = await apiFetch<{ provider: ProviderSummary }>('/api/providers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.provider;
  },

  async update(id: string, input: ProviderInputPayload): Promise<ProviderSummary> {
    const data = await apiFetch<{ provider: ProviderSummary }>(`/api/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return data.provider;
  },

  async remove(id: string): Promise<void> {
    await apiFetch<{ ok: boolean }>(`/api/providers/${id}`, {
      method: 'DELETE',
    });
  },

  async setEnhance(input: { providerId: string | null; model: string | null }): Promise<EnhanceConfig> {
    return apiFetch<EnhanceConfig>('/api/providers/enhance', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async test(input: {
    providerId?: string;
    protocol?: string;
    baseUrl?: string;
    apiKey?: string;
    accountId?: string;
  }): Promise<TestResult> {
    return apiFetch<TestResult>('/api/providers/test', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
