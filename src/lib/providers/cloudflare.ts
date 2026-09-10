import type { ImageGenerateParams, GenerateResponse, ImageResult } from '@/lib/api';
import { ProviderUpstreamError, resolveApiKey } from './adapter';
import type { ImageProviderAdapter } from './adapter';
import { CF_DEFAULT_BASE_URL } from './validate';
import type { ProviderConfig } from './types';

// Dialek parameter Workers AI beda antar keluarga model:
// - keluarga SD (stabilityai, runwayml, bytedance, lykon): num_inference_steps, guidance_scale, negative_prompt
// - keluarga flux/leonardo: steps, guidance, tanpa negative_prompt
function isSdFamily(modelId: string): boolean {
  return /stabilityai|runwayml|bytedance|lykon/.test(modelId);
}

function buildRequestBody(params: ImageGenerateParams): Record<string, unknown> {
  const modelId = String(params.model || '');
  const sd = isSdFamily(modelId);

  const body: Record<string, unknown> = { prompt: params.prompt };
  if (sd && params.negative_prompt) body.negative_prompt = params.negative_prompt;

  const m = /^(\d+)x(\d+)$/.exec(String(params.image_size || ''));
  if (m) {
    body.width = Number(m[1]);
    body.height = Number(m[2]);
  }

  const steps = Number(params.num_inference_steps);
  if (steps > 0) {
    if (sd) body.num_inference_steps = steps;
    else body.steps = steps;
  }

  const guidance = Number(params.guidance_scale);
  if (guidance > 0) {
    if (sd) body.guidance_scale = guidance;
    else body.guidance = guidance;
  }

  if (typeof params.seed === 'number' && params.seed >= 0) body.seed = params.seed;

  return body;
}

interface CfApiResponse {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  result?: { image?: string; format?: string };
}

export const cloudflareWorkersAiAdapter: ImageProviderAdapter = {
  async generate(config: ProviderConfig, params: ImageGenerateParams): Promise<GenerateResponse> {
    const apiKey = resolveApiKey(config);
    if (!apiKey) {
      throw new ProviderUpstreamError(`Provider "${config.name}" (Cloudflare) butuh API Token. Isi di Settings.`);
    }
    const accountId = config.accountId?.trim();
    if (!accountId) {
      throw new ProviderUpstreamError(`Provider "${config.name}" (Cloudflare) butuh Account ID. Isi di Settings.`);
    }

    const base = (config.baseUrl || CF_DEFAULT_BASE_URL).replace(/\/+$/, '');
    const url = `${base}/accounts/${encodeURIComponent(accountId)}/ai/run/${params.model}`;
    const body = buildRequestBody(params);

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
  let res = await postOnce(url, apiKey, body);

  // Schema model Cloudflare bersifat ketat (additionalProperties: false).
  // Kalau body berisi properti yang tidak didukung model ini (mis. flux
  // tidak menerima width/height/guidance), hapus properti tsb lalu retry.
  if (!res.ok && res.status === 400) {
    const errText = await res.text().catch(() => '');
    const propMatch = errText.match(/properties '([^']+)'/);
    if (propMatch && errText.includes('not allowed')) {
      const rejected = propMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/^\//, ''))
        .filter(Boolean);
      const retryBody = { ...body };
      for (const prop of rejected) delete retryBody[prop];
      if (Object.keys(retryBody).length !== Object.keys(body).length) {
        res = await postOnce(url, apiKey, retryBody);
      }
    }
  }

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let message = await res.text().catch(() => '');
    if (contentType.includes('application/json')) {
      const err = (await res.json().catch(() => null)) as CfApiResponse | null;
      message = err?.errors?.[0]?.message || message;
    }
    throw new ProviderUpstreamError(`Cloudflare ${res.status}: ${message.slice(0, 300)}`, res.status);
  }

  return parseImages(res, contentType);
}

async function postOnce(
  url: string,
  apiKey: string,
  body: Record<string, unknown>
): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new ProviderUpstreamError(
      `Tidak bisa menghubungi Cloudflare API: ${e instanceof Error ? e.message : 'network error'}`
    );
  }
}

async function parseImages(res: Response, contentType: string): Promise<ImageResult[]> {
  // Respons bisa JSON ({result:{image,format}}) atau binary langsung
  if (contentType.includes('application/json')) {
    const data = (await res.json().catch(() => null)) as CfApiResponse | null;
    const image = data?.result?.image;
    if (!image) {
      throw new ProviderUpstreamError('Cloudflare tidak mengembalikan gambar');
    }
    return [{ url: '', b64_json: image, mime_type: data?.result?.format || 'image/png' }];
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new ProviderUpstreamError('Cloudflare tidak mengembalikan gambar');
  }
  return [{ url: '', b64_json: buf.toString('base64'), mime_type: contentType.split(';')[0] || 'image/png' }];
}
