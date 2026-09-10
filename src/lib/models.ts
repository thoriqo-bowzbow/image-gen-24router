import type { ModelInfo } from './api';

const CACHE_KEY = 't2i-models-cache';
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheData {
  models: ModelInfo[];
  timestamp: number;
}

export function getCachedModels(): ModelInfo[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CacheData = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data.models;
  } catch {
    return null;
  }
}

export function setCachedModels(models: ModelInfo[]): void {
  try {
    const data: CacheData = { models, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function groupByProvider(models: ModelInfo[]): Record<string, ModelInfo[]> {
  const groups: Record<string, ModelInfo[]> = {};
  for (const m of models) {
    const parts = m.id.split('/');
    const provider = parts.length >= 2 ? parts[0] : 'unknown';
    if (!groups[provider]) groups[provider] = [];
    groups[provider].push(m);
  }
  return groups;
}

export interface DefaultParams {
  image_size: string;
  batch_size: number;
  num_inference_steps: number;
  guidance_scale: number;
  seed: number;
  negative_prompt: string;
  style_preset: string;
  [key: string]: unknown;
}

export function getDefaultParams(): DefaultParams {
  return {
    image_size: '1024x1024',
    batch_size: 1,
    num_inference_steps: 4,
    guidance_scale: 3.5,
    seed: -1,
    negative_prompt: '',
    style_preset: '',
  };
}

export function modelShortName(modelId: string): string {
  const parts = modelId.split('/');
  return parts[parts.length - 1] || modelId;
}

export function providerName(modelId: string): string {
  const parts = modelId.split('/');
  return parts.length >= 2 ? parts[0] : 'unknown';
}