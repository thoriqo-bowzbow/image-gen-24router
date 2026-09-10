'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GalleryEntry } from '@/lib/db';
import {
  getAllEntries,
  addEntry,
  deleteEntry,
  clearAll,
} from '@/lib/db';

export function useGallery() {
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const all = await getAllEntries();
      setEntries(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (entry: GalleryEntry) => {
      await addEntry(entry);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteEntry(id);
      await refresh();
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    await clearAll();
    setEntries([]);
  }, []);

  return { entries, loading, save, remove, clear, refresh };
}