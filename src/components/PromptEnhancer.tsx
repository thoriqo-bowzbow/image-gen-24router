'use client';

import { useState } from 'react';
import { BrutalTextarea, BrutalButton } from '@/components/NeoBrutalistUI';
import { enhancePrompt } from '@/lib/api';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';

interface PromptEnhancerProps {
  originalPrompt: string;
  onEnhanced: (enhanced: string) => void;
  disabled?: boolean;
}

export function PromptEnhancer({
  originalPrompt,
  onEnhanced,
  disabled,
}: PromptEnhancerProps) {
  const [loading, setLoading] = useState(false);
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!originalPrompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await enhancePrompt(originalPrompt);
      setEnhanced(result);
      setEditValue(result);
      setEditing(true);
      onEnhanced(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enhance gagal');
      setEnhanced(null);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (editing && editValue.trim()) {
      onEnhanced(editValue.trim());
    }
    setEditing(false);
    setError(null);
  };

  const handleReject = () => {
    setEnhanced(null);
    setEditing(false);
    setError(null);
    onEnhanced(originalPrompt);
  };

  return (
    <div className="flex flex-col gap-2">
      {!enhanced && (
        <BrutalButton
          variant="accent"
          size="sm"
          onClick={handleEnhance}
          disabled={disabled || loading || !originalPrompt.trim()}
        >
          <Sparkles size={14} />
          {loading ? (
            <>
              Mengembangkan prompt... <Loader2 size={12} className="animate-spin" />
            </>
          ) : (
            'Enhance Prompt'
          )}
        </BrutalButton>
      )}

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border-2 border-red-700 px-3 py-2">
          {error}
        </div>
      )}

      {editing && (
        <div className="flex flex-col gap-2">
          <BrutalTextarea
            aria-label="Prompt hasil enhance"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-[60px]"
          />
          <div className="flex gap-2">
            <BrutalButton size="sm" variant="accent" onClick={handleAccept}>
              <Check size={14} /> Accept
            </BrutalButton>
            <BrutalButton size="sm" onClick={handleReject}>
              <X size={14} /> Reject
            </BrutalButton>
          </div>
        </div>
      )}

      {enhanced && !editing && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Prompt enhanced ✓</span>
          <button
            onClick={() => {
              setEditing(true);
              setEditValue(enhanced);
            }}
            className="text-xs underline underline-offset-4"
          >
            edit
          </button>
          <button onClick={handleReject} className="text-xs underline underline-offset-4">
            reset
          </button>
        </div>
      )}
    </div>
  );
}