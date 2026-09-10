'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ModelInfo } from '@/lib/api';
import { providersApi } from '@/lib/api';

interface ActiveModels {
  models: ModelInfo[];
  error: string | null;
}

async function fetchActiveModels(): Promise<ActiveModels> {
  try {
    const data = await providersApi.list();
    const active = data.providers.find((p) => p.id === data.activeProviderId);
    if (!active) {
      return { models: [], error: 'Belum ada provider aktif. Atur provider di halaman Settings.' };
    }
    return { models: active.models, error: null };
  } catch (e) {
    return { models: [], error: e instanceof Error ? e.message : 'Gagal memuat daftar model' };
  }
}

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchActiveModels();
      setModels(result.models);
      setError(result.error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { models, loading, error, refresh: load };
}
