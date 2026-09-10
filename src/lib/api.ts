import type { ProviderSummary } from '@/lib/providers/types';

export type { ProviderSummary };

export interface ModelInfo {
  id: string;
  object: string;
  owned_by: string;
  capabilities?: string[];
  max_image_size?: string;
  step_range?: [number, number];
  cfg_range?: [number, number];
  max_batch?: number;
  style_presets?: string[];
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
}

export interface GenerateResponse {
  created: number;
  data: ImageResult[];
}

export interface ProviderInputPayload {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
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

export async function saveImageToServer(
  base64: string,
  filename: string
): Promise<string> {
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, filename }),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  const data = await res.json();
  return data.url;
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

  async test(input: { providerId?: string; baseUrl?: string; apiKey?: string }): Promise<TestResult> {
    return apiFetch<TestResult>('/api/providers/test', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
