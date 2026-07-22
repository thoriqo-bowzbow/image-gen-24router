'use client';

import { useState, useEffect } from 'react';
import type { ModelInfo } from '@/lib/api';
import { IMAGE_MODELS } from '@/lib/imageModels';

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setModels(IMAGE_MODELS);
    setLoading(false);
  }, []);

  return { models, loading, error, refresh: () => {} };
}