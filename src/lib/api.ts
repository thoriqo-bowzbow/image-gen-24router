const PROXY_BASE = '/api/proxy';

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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const data = await apiFetch<{ data: ModelInfo[] }>('/v1/models');
    return data.data || [];
  } catch {
    return [];
  }
}

export async function generateImage(params: ImageGenerateParams): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>('/v1/images/generations', {
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
  if (!res.ok) throw new Error(`Enhance failed: ${res.status}`);
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