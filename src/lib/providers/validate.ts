import type { ModelInfo } from '@/lib/api';

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
    if (typeof rec.max_image_size === 'string' && rec.max_image_size) model.max_image_size = rec.max_image_size;
    if (isRange(rec.step_range)) model.step_range = rec.step_range;
    if (isRange(rec.cfg_range)) model.cfg_range = rec.cfg_range;
    if (typeof rec.max_batch === 'number') model.max_batch = rec.max_batch;
    if (isStringArray(rec.style_presets)) model.style_presets = rec.style_presets;
    if (isStringArray(rec.capabilities)) model.capabilities = rec.capabilities;
    out.push(model);
  }
  return out;
}

function isRange(v: unknown): v is [number, number] {
  return Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number');
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}
