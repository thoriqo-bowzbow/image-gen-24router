import type { ImageGenerateParams, GenerateResponse, ImageResult } from '@/lib/api';
import { ProviderUpstreamError, resolveApiKey } from './adapter';
import type { ImageProviderAdapter } from './adapter';
import type { ProviderConfig } from './types';

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

export const openAICompatibleAdapter: ImageProviderAdapter = {
  async generate(config: ProviderConfig, params: ImageGenerateParams): Promise<GenerateResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = resolveApiKey(config);
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    let res: Response;
    try {
      res = await fetch(endpoint(config.baseUrl, '/v1/images/generations'), {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
    } catch (e) {
      throw new ProviderUpstreamError(
        `Tidak bisa menghubungi provider di ${config.baseUrl}: ${e instanceof Error ? e.message : 'network error'}`
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ProviderUpstreamError(
        `Upstream ${res.status}: ${text.slice(0, 300)}`,
        res.status
      );
    }

    const data: unknown = await res.json().catch(() => null);
    if (!data || typeof data !== 'object' || !Array.isArray((data as Record<string, unknown>).data)) {
      throw new ProviderUpstreamError('Format response upstream tidak dikenal (tidak ada data[])');
    }

    const raw = data as { created?: unknown; data?: unknown[] };
    const images: ImageResult[] = [];
    for (const item of raw.data ?? []) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      const img: ImageResult = { url: '' };
      if (typeof rec.b64_json === 'string' && rec.b64_json) img.b64_json = rec.b64_json;
      if (typeof rec.url === 'string' && rec.url) img.url = rec.url;
      if (typeof rec.revised_prompt === 'string' && rec.revised_prompt) img.revised_prompt = rec.revised_prompt;
      if (img.url || img.b64_json) images.push(img);
    }

    return {
      created: typeof raw.created === 'number' ? raw.created : Math.floor(Date.now() / 1000),
      data: images,
    };
  },
};
