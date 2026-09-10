'use client';

import { useState, useCallback } from 'react';
import type { ImageGenerateParams, GenerateResponse } from '@/lib/api';
import { generateImage } from '@/lib/api';

export type GenerationStatus = 'idle' | 'loading' | 'enhancing' | 'success' | 'error';

interface GenerationState {
  status: GenerationStatus;
  result: GenerateResponse | null;
  error: string | null;
  progress: string;
}

export function useGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    result: null,
    error: null,
    progress: '',
  });

  const generate = useCallback(async (params: ImageGenerateParams) => {
    setState({ status: 'loading', result: null, error: null, progress: 'Generating...' });
    try {
      const result = await generateImage(params);
      setState({ status: 'success', result, error: null, progress: 'Done' });
    } catch (e) {
      setState({
        status: 'error',
        result: null,
        error: e instanceof Error ? e.message : 'Generation failed',
        progress: 'Failed',
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', result: null, error: null, progress: '' });
  }, []);

  return { ...state, generate, reset };
}