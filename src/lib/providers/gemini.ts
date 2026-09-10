import type { ImageGenerateParams, GenerateResponse, ImageResult } from '@/lib/api';
import { ProviderUpstreamError, resolveApiKey } from './adapter';
import type { ImageProviderAdapter } from './adapter';
import { GEMINI_DEFAULT_BASE_URL } from './validate';
import type { ProviderConfig } from './types';

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

function pickAspectRatio(size?: string): string | undefined {
  if (!size) return undefined;
  const m = /^(\d+)x(\d+)$/.exec(size.trim());
  if (!m) return undefined;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!w || !h) return undefined;
  const target = w / h;
  return ASPECT_RATIOS.reduce((best, r) => {
    const [bw, bh] = best.split(':').map(Number);
    const [rw, rh] = r.split(':').map(Number);
    return Math.abs(rw / rh - target) < Math.abs(bw / bh - target) ? r : best;
  }, ASPECT_RATIOS[0]);
}

interface GeminiApiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
      }[];
    };
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

export const googleGeminiAdapter: ImageProviderAdapter = {
  async generate(config: ProviderConfig, params: ImageGenerateParams): Promise<GenerateResponse> {
    const apiKey = resolveApiKey(config);
    if (!apiKey) {
      throw new ProviderUpstreamError(`Provider "${config.name}" (Google Gemini) butuh API key. Isi di Settings.`);
    }

    const url = `${(config.baseUrl || GEMINI_DEFAULT_BASE_URL).replace(/\/+$/, '')}/models/${encodeURIComponent(params.model)}:generateContent`;
    const aspectRatio = pickAspectRatio(params.image_size);

    const prompt = params.negative_prompt
      ? `${params.prompt}\n\nAvoid the following: ${params.negative_prompt}`
      : params.prompt;

    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
      },
    };

    const count = Math.max(1, Math.min(Number(params.batch_size) || 1, 4));
    const results = await Promise.all(
      Array.from({ length: count }, () => requestOnce(url, apiKey, body))
    );

    return {
      created: Math.floor(Date.now() / 1000),
      data: results.flat(),
    };
  },
};

async function requestOnce(
  url: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<ImageResult[]> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new ProviderUpstreamError(
      `Tidak bisa menghubungi Google Gemini API: ${e instanceof Error ? e.message : 'network error'}`
    );
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as GeminiApiResponse | null;
    const message = err?.error?.message || (await res.text().catch(() => ''));
    throw new ProviderUpstreamError(`Google Gemini ${res.status}: ${message.slice(0, 300)}`, res.status);
  }

  const data = (await res.json().catch(() => null)) as GeminiApiResponse | null;
  if (!data) {
    throw new ProviderUpstreamError('Format response Google Gemini tidak dikenal');
  }

  if (data.promptFeedback?.blockReason) {
    throw new ProviderUpstreamError(`Prompt diblokir oleh safety filter: ${data.promptFeedback.blockReason}`);
  }

  const images: ImageResult[] = [];
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      images.push({
        url: '',
        b64_json: part.inlineData.data,
        mime_type: part.inlineData.mimeType || 'image/png',
      });
    }
  }

  if (images.length === 0) {
    throw new ProviderUpstreamError('Google Gemini tidak mengembalikan gambar');
  }
  return images;
}
