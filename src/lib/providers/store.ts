import { promises as fs } from 'fs';
import path from 'path';
import type { ProvidersFile, ProviderConfig, EnhanceConfig } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'providers.json');

const EMPTY: ProvidersFile = {
  activeProviderId: null,
  enhanceProviderId: null,
  enhanceModelId: null,
  providers: [],
};

export async function readProvidersFile(): Promise<ProvidersFile> {
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY };
    return {
      activeProviderId: typeof parsed.activeProviderId === 'string' ? parsed.activeProviderId : null,
      enhanceProviderId: typeof parsed.enhanceProviderId === 'string' ? parsed.enhanceProviderId : null,
      enhanceModelId: typeof parsed.enhanceModelId === 'string' ? parsed.enhanceModelId : null,
      providers: Array.isArray(parsed.providers) ? parsed.providers : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export async function writeProvidersFile(data: ProvidersFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE_PATH}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmp, FILE_PATH);
}

export async function getActiveProvider(): Promise<ProviderConfig | null> {
  const data = await readProvidersFile();
  if (!data.activeProviderId) return null;
  return data.providers.find((p) => p.id === data.activeProviderId) ?? null;
}

/**
 * Target untuk prompt enhancer: prioritas konfigurasi khusus
 * (enhanceProviderId + enhanceModelId), fallback ke enhanceModel
 * milik provider aktif (konfigurasi lama).
 */
export async function getEnhanceTarget(): Promise<{ provider: ProviderConfig; model: string } | null> {
  const data = await readProvidersFile();
  if (data.enhanceProviderId && data.enhanceModelId) {
    const provider = data.providers.find((p) => p.id === data.enhanceProviderId);
    if (provider) {
      return { provider, model: data.enhanceModelId };
    }
  }
  const active = data.activeProviderId
    ? data.providers.find((p) => p.id === data.activeProviderId)
    : null;
  if (active?.enhanceModel) {
    return { provider: active, model: active.enhanceModel };
  }
  return null;
}

export async function getEnhanceConfig(): Promise<EnhanceConfig> {
  const data = await readProvidersFile();
  if (data.enhanceProviderId || data.enhanceModelId) {
    return { providerId: data.enhanceProviderId, model: data.enhanceModelId };
  }
  // Tampilkan konfigurasi legacy sebagai nilai awal
  const legacy = data.providers.find((p) => p.enhanceModel);
  return { providerId: legacy?.id ?? null, model: legacy?.enhanceModel ?? null };
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'provider'
  );
}

export function uniqueSlug(base: string, existing: ProviderConfig[]): string {
  if (!existing.some((p) => p.id === base)) return base;
  let i = 2;
  while (existing.some((p) => p.id === `${base}-${i}`)) i++;
  return `${base}-${i}`;
}
