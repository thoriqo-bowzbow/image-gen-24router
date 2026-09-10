import type { ModelInfo } from '@/lib/api';

export const GEMINI_DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
export const CF_DEFAULT_BASE_URL = 'https://api.cloudflare.com/client/v4';

export function resolveBaseUrl(raw: unknown, protocol: string): string {
  const url = typeof raw === 'string' ? raw.trim() : '';
  if (protocol === 'google-gemini') {
    if (!url) return GEMINI_DEFAULT_BASE_URL;
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('baseUrl harus diawali http:// atau https://');
    }
    return url.replace(/\/+$/, '');
  }
  if (protocol === 'cloudflare-workers-ai') {
    if (!url) return CF_DEFAULT_BASE_URL;
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('baseUrl harus diawali http:// atau https://');
    }
    return url.replace(/\/+$/, '');
  }
  return sanitizeBaseUrl(raw);
}

export function sanitizeBaseUrl(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('baseUrl wajib diisi');
  }
  const url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('baseUrl harus diawali http:// atau https://');
  }
  return url.replace(/\/+$/, '');
}

export function sanitizeModels(raw: unknown): ModelInfo[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error('models harus berupa array');
  const out: ModelInfo[] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') {
      throw new Error('Setiap model harus berupa object');
    }
    const rec = m as Record<string, unknown>;
    if (typeof rec.id !== 'string' || !rec.id.trim()) {
      throw new Error('Setiap model butuh field id');
    }
    const model: ModelInfo = {
      id: rec.id.trim(),
      object: 'model',
      owned_by: typeof rec.owned_by === 'string' && rec.owned_by ? rec.owned_by : 'custom',
    };
    if (typeof rec.description === 'string' && rec.description) model.description = rec.description;
    out.push(model);
  }
  return out;
}
