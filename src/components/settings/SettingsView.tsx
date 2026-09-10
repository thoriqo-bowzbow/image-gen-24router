'use client';

import { useState, useEffect, useCallback } from 'react';
import { providersApi } from '@/lib/api';
import type { ProviderSummary, ModelInfo } from '@/lib/api';
import {
  BrutalButton,
  BrutalInput,
  BrutalSelect,
  BrutalCard,
  BrutalBadge,
} from '@/components/NeoBrutalistUI';
import { Plus, Trash2, Pencil, X, Loader2, PlugZap, Check, AlertCircle } from 'lucide-react';

interface ProviderFields {
  name: string;
  baseUrl: string;
  protocol: 'openai-compatible' | 'google-gemini' | 'cloudflare-workers-ai';
  apiKey: string;
  accountId: string;
}

const EMPTY_FIELDS: ProviderFields = {
  name: '',
  baseUrl: '',
  protocol: 'openai-compatible',
  apiKey: '',
  accountId: '',
};

interface FormModelState {
  id: string;
  owned_by: string;
  description: string;
}

const EMPTY_MODEL: FormModelState = {
  id: '',
  owned_by: '',
  description: '',
};

function modelToForm(m: ModelInfo): FormModelState {
  return {
    id: m.id,
    owned_by: m.owned_by || '',
    description: m.description || '',
  };
}

function formToModel(f: FormModelState): ModelInfo {
  const m: ModelInfo = { id: f.id.trim(), object: 'model', owned_by: f.owned_by.trim() || 'custom' };
  if (f.description.trim()) m.description = f.description.trim();
  return m;
}

export function SettingsView() {
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<'closed' | 'new' | 'edit'>('closed');
  const [editId, setEditId] = useState<string | null>(null);
  const [fields, setFields] = useState<ProviderFields>(EMPTY_FIELDS);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [testState, setTestState] = useState<Record<string, { loading: boolean; ok?: boolean; message: string }>>({});

  const [modelsOpenId, setModelsOpenId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<{ editIndex: number | null; state: FormModelState } | null>(null);

  const [enhanceProvider, setEnhanceProvider] = useState<string>('');
  const [enhanceModelId, setEnhanceModelId] = useState<string>('');
  const [enhanceSaved, setEnhanceSaved] = useState(false);
  const [savingEnhance, setSavingEnhance] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await providersApi.list();
      setProviders(data.providers);
      setActiveId(data.activeProviderId);
      setEnhanceProvider(data.enhance?.providerId ?? '');
      setEnhanceModelId(data.enhance?.model ?? '');
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Gagal memuat provider');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setFields(EMPTY_FIELDS);
    setEditId(null);
    setFormMode('new');
    setFormError(null);
  };

  const openEdit = (p: ProviderSummary) => {
    setFields({
      name: p.name,
      baseUrl: p.baseUrl,
      protocol: p.protocol,
      apiKey: '',
      accountId: p.accountId || '',
    });
    setEditId(p.id);
    setFormMode('edit');
    setFormError(null);
  };

  const handleSaveProvider = async () => {
    setFormError(null);
    if (!fields.name.trim()) return setFormError('Nama wajib diisi.');
    if (fields.protocol === 'openai-compatible' && !/^https?:\/\//i.test(fields.baseUrl.trim())) {
      return setFormError('Base URL harus diawali http:// atau https://.');
    }
    if (fields.protocol === 'cloudflare-workers-ai') {
      if (!fields.accountId.trim()) return setFormError('Account ID Cloudflare wajib diisi.');
      if (formMode === 'new' && !fields.apiKey.trim()) {
        return setFormError('API Token Cloudflare wajib diisi.');
      }
    }
    setSaving(true);
    try {
      const payload = {
        name: fields.name,
        baseUrl: fields.protocol === 'openai-compatible' ? fields.baseUrl : '',
        protocol: fields.protocol,
        ...(fields.apiKey ? { apiKey: fields.apiKey } : {}),
        accountId: fields.accountId,
      };
      if (formMode === 'new') {
        await providersApi.create(payload);
      } else if (editId) {
        await providersApi.update(editId, payload);
      }
      setFormMode('closed');
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: ProviderSummary) => {
    if (!window.confirm(`Hapus provider "${p.name}" beserta ${p.models.length} modelnya?`)) return;
    try {
      await providersApi.remove(p.id);
      await load();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Gagal menghapus provider');
    }
  };

  const handleSetActive = async (p: ProviderSummary) => {
    try {
      await providersApi.update(p.id, { setActive: true });
      await load();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Gagal mengatur provider aktif');
    }
  };

  const runTest = async (
    key: string,
    input: { providerId?: string; protocol?: string; baseUrl?: string; apiKey?: string; accountId?: string }
  ) => {
    setTestState((s) => ({ ...s, [key]: { loading: true, message: '' } }));
    try {
      const result = await providersApi.test(input);
      setTestState((s) => ({ ...s, [key]: { loading: false, ok: result.ok, message: result.message } }));
    } catch (e) {
      setTestState((s) => ({
        ...s,
        [key]: { loading: false, ok: false, message: e instanceof Error ? e.message : 'Test gagal' },
      }));
    }
  };

  const saveModels = async (providerId: string, models: ModelInfo[]) => {
    try {
      await providersApi.update(providerId, { models });
      await load();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Gagal menyimpan model');
    }
  };

  const handleSaveEnhance = async () => {
    setEnhanceSaved(false);
    setPageError(null);
    if (enhanceProvider && !enhanceModelId.trim()) {
      setPageError('Enhance model wajib diisi jika provider enhance dipilih.');
      return;
    }
    setSavingEnhance(true);
    try {
      await providersApi.setEnhance({
        providerId: enhanceProvider || null,
        model: enhanceModelId.trim() || null,
      });
      setEnhanceSaved(true);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Gagal menyimpan konfigurasi enhance');
    } finally {
      setSavingEnhance(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-ui tracking-tight mb-1">
            <span className="bg-[var(--fg)] text-[var(--bg)] px-2 py-1">SETTINGS</span>
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono">
            Kelola AI provider (OpenAI-compatible) & daftar model image
          </p>
        </div>
        {formMode === 'closed' && (
          <BrutalButton size="sm" onClick={openNew}>
            <Plus size={14} /> Tambah Provider
          </BrutalButton>
        )}
      </div>

      {pageError && (
        <div className="brutal-card !border-[var(--accent)] text-xs text-[var(--accent)] font-mono" role="alert">
          {pageError}
        </div>
      )}

      {!loading && (
        <BrutalCard>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <span className="text-sm font-bold">PROMPT ENHANCER</span>
            {enhanceSaved && (
              <span className="text-xs font-mono text-[var(--fg)] flex items-center gap-1">
                <Check size={12} /> tersimpan
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BrutalSelect
              label="Provider Enhance"
              value={enhanceProvider}
              onChange={(e) => {
                setEnhanceProvider(e.target.value);
                setEnhanceSaved(false);
              }}
              options={[
                { value: '', label: '— ikuti provider image aktif —' },
                ...providers.map((p) => ({ value: p.id, label: `${p.name} (${p.protocol})` })),
              ]}
            />
            {enhanceProvider && (
              <BrutalInput
                label="Model Enhance (chat model)"
                placeholder={
                  providers.find((p) => p.id === enhanceProvider)?.protocol === 'google-gemini'
                    ? 'mis. gemini-3.6-flash'
                    : providers.find((p) => p.id === enhanceProvider)?.protocol === 'cloudflare-workers-ai'
                      ? 'mis. @cf/meta/llama-3.1-8b-instruct'
                      : 'mis. gpt-4o-mini'
                }
                value={enhanceModelId}
                onChange={(e) => {
                  setEnhanceModelId(e.target.value);
                  setEnhanceSaved(false);
                }}
              />
            )}
          </div>
          <p className="text-xs text-[var(--muted)] font-mono mt-2">
            Prompt enhancer boleh pakai provider/model yang berbeda dari image generator
            (mis. enhance pakai Gemini, generate pakai Cloudflare). Kosongkan untuk mengikuti provider aktif.
          </p>
          <BrutalButton size="sm" className="mt-3" onClick={handleSaveEnhance} disabled={savingEnhance}>
            {savingEnhance ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Simpan Enhancer
          </BrutalButton>
        </BrutalCard>
      )}

      {formMode !== 'closed' && (
        <BrutalCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">
              {formMode === 'new' ? 'Provider Baru' : `Edit Provider: ${editId}`}
            </span>
            <button onClick={() => setFormMode('closed')} className="text-[var(--muted)] hover:text-[var(--fg)]">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <BrutalInput
                label="Nama Provider"
                placeholder="mis. gateway-utama"
                value={fields.name}
                onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
              />
              <BrutalSelect
                label="Protokol"
                value={fields.protocol}
                onChange={(e) => setFields((f) => ({ ...f, protocol: e.target.value as ProviderFields['protocol'] }))}
                options={[
                  { value: 'openai-compatible', label: 'OpenAI-compatible (gateway, OpenRouter, vLLM, dll)' },
                  { value: 'google-gemini', label: 'Google Gemini (Nano Banana)' },
                  { value: 'cloudflare-workers-ai', label: 'Cloudflare Workers AI' },
                ]}
              />
              {fields.protocol === 'openai-compatible' && (
                <BrutalInput
                  label="Base URL"
                  placeholder="https://api.provider.com"
                  value={fields.baseUrl}
                  onChange={(e) => setFields((f) => ({ ...f, baseUrl: e.target.value }))}
                />
              )}
              {fields.protocol === 'google-gemini' && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Base URL</span>
                  <span className="text-xs font-mono text-[var(--muted)]">
                    Memakai endpoint resmi Google: generativelanguage.googleapis.com — cukup isi API key.
                  </span>
                </div>
              )}
              {fields.protocol === 'cloudflare-workers-ai' && (
                <>
                  <BrutalInput
                    label="Account ID"
                    placeholder="mis. 023e105f4ecef8ad9ca31a8372d0c353"
                    value={fields.accountId}
                    onChange={(e) => setFields((f) => ({ ...f, accountId: e.target.value }))}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Base URL</span>
                    <span className="text-xs font-mono text-[var(--muted)]">
                      Memakai endpoint resmi Cloudflare: api.cloudflare.com/client/v4 — cukup Account ID + API Token.
                    </span>
                  </div>
                </>
              )}
              <BrutalInput
                label={fields.protocol === 'cloudflare-workers-ai' ? 'API Token Cloudflare' : 'API Key (opsional)'}
                type="password"
                placeholder={
                  fields.protocol === 'cloudflare-workers-ai'
                    ? 'token dengan izin Workers AI (Read)'
                    : formMode === 'edit'
                      ? 'kosongkan untuk tidak mengubah'
                      : 'kosongkan jika tidak perlu'
                }
                value={fields.apiKey}
                onChange={(e) => setFields((f) => ({ ...f, apiKey: e.target.value }))}
              />
            </div>
            {formError && (
              <p className="text-xs text-[var(--accent)] font-mono">{formError}</p>
            )}
            <div className="flex gap-2">
              <BrutalButton variant="accent" size="sm" onClick={handleSaveProvider} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Simpan
              </BrutalButton>
              {(fields.protocol !== 'openai-compatible' || fields.baseUrl.trim()) && (
                <BrutalButton
                  size="sm"
                  onClick={() =>
                    runTest('__form__', {
                      baseUrl: fields.baseUrl,
                      protocol: fields.protocol,
                      apiKey: fields.apiKey || undefined,
                      accountId: fields.accountId || undefined,
                    })
                  }
                >
                  <PlugZap size={14} /> Test Koneksi
                </BrutalButton>
              )}
              {testState['__form__'] && !testState['__form__'].loading && (
                <span
                  className={`text-xs font-mono self-center ${testState['__form__'].ok ? 'text-[var(--fg)]' : 'text-[var(--accent)]'}`}
                >
                  {testState['__form__'].message}
                </span>
              )}
            </div>
          </div>
        </BrutalCard>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
          <Loader2 size={14} className="animate-spin" /> loading...
        </div>
      ) : providers.length === 0 ? (
        <BrutalCard>
          <p className="text-sm font-bold">Belum ada provider</p>
          <p className="text-xs text-[var(--muted)] mt-1">
            Tambahkan provider OpenAI-compatible apa saja, lalu tambahkan model image-nya manual.
          </p>
        </BrutalCard>
      ) : (
        providers.map((p) => {
          const isActive = p.id === activeId;
          const test = testState[p.id];
          return (
            <BrutalCard key={p.id} className={isActive ? '!border-[var(--accent)]' : ''}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{p.name}</span>
                    {isActive ? (
                      <BrutalBadge variant="accent">AKTIF</BrutalBadge>
                    ) : (
                      <BrutalBadge variant="outline">{p.id}</BrutalBadge>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[var(--muted)]">{p.baseUrl}</span>
                  <span className="text-xs font-mono text-[var(--muted)]">
                    {p.protocol} · API key: {p.hasApiKey ? 'tersimpan' : 'tidak ada'}
                    {p.accountId ? ` · account: ${p.accountId.slice(0, 8)}…` : ''} · {p.models.length} model
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <BrutalButton size="sm" onClick={() => runTest(p.id, { providerId: p.id })}>
                    <PlugZap size={14} /> Test
                  </BrutalButton>
                  <BrutalButton size="sm" onClick={() => setModelsOpenId(modelsOpenId === p.id ? null : p.id)}>
                    {p.models.length} Model
                  </BrutalButton>
                  <BrutalButton size="sm" onClick={() => openEdit(p)}>
                    <Pencil size={14} />
                  </BrutalButton>
                  {isActive ? (
                    <BrutalButton size="sm" variant="accent" disabled>
                      <Check size={14} /> AKTIF
                    </BrutalButton>
                  ) : (
                    <BrutalButton size="sm" variant="accent" onClick={() => handleSetActive(p)}>
                      Jadikan Aktif
                    </BrutalButton>
                  )}
                  <BrutalButton size="sm" onClick={() => handleDelete(p)} aria-label={`Hapus ${p.name}`}>
                    <Trash2 size={14} />
                  </BrutalButton>
                </div>
              </div>

              {test && !test.loading && (
                <p
                  className={`text-xs font-mono mt-2 flex items-center gap-1 ${test.ok ? '' : 'text-[var(--accent)]'}`}
                  role="status"
                >
                  {test.ok ? <Check size={12} /> : <AlertCircle size={12} />}
                  {test.message}
                </p>
              )}
              {test?.loading && (
                <p className="text-xs font-mono mt-2 text-[var(--muted)] flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> testing...
                </p>
              )}

              {modelsOpenId === p.id && (
                <div className="mt-4 pt-4 border-t-[var(--border-w)] border-[var(--border)] flex flex-col gap-3">
                  {p.models.length === 0 && (
                    <p className="text-xs text-[var(--muted)] font-mono">
                      Belum ada model. Tambahkan model image-gen milik provider ini.
                    </p>
                  )}
                  {p.models.map((m, i) => (
                    <div key={m.id} className="flex items-start justify-between gap-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold break-all">{m.id}</span>
                        <span className="text-[var(--muted)] font-mono">
                          {m.owned_by}
                          {m.description ? ` · ${m.description}` : ''}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <BrutalButton size="sm" onClick={() => setModelForm({ editIndex: i, state: modelToForm(m) })}>
                          <Pencil size={12} />
                        </BrutalButton>
                        <BrutalButton
                          size="sm"
                          onClick={() => {
                            const next = p.models.filter((_, j) => j !== i);
                            saveModels(p.id, next);
                          }}
                          aria-label={`Hapus model ${m.id}`}
                        >
                          <Trash2 size={12} />
                        </BrutalButton>
                      </div>
                    </div>
                  ))}

                  {modelForm ? (
                    <div className="brutal-card flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {modelForm.editIndex !== null ? 'Edit Model' : 'Model Baru'}
                        </span>
                        <button onClick={() => setModelForm(null)} className="text-[var(--muted)] hover:text-[var(--fg)]">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <BrutalInput
                          label="Model ID"
                          placeholder="mis. @cf/black-forest-labs/flux-1-schnell"
                          value={modelForm.state.id}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, id: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Label"
                          placeholder="mis. FLUX.1 Schnell"
                          value={modelForm.state.owned_by}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, owned_by: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Deskripsi (opsional)"
                          placeholder="mis. cepat, kualitas bagus"
                          value={modelForm.state.description}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, description: e.target.value } })
                          }
                        />
                      </div>
                      <BrutalButton
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          if (!modelForm.state.id.trim()) return;
                          const m = formToModel(modelForm.state);
                          const next = [...p.models];
                          if (modelForm.editIndex !== null) next[modelForm.editIndex] = m;
                          else next.push(m);
                          saveModels(p.id, next);
                          setModelForm(null);
                        }}
                      >
                        <Check size={14} /> Simpan Model
                      </BrutalButton>
                    </div>
                  ) : (
                    <div>
                      <BrutalButton size="sm" onClick={() => setModelForm({ editIndex: null, state: { ...EMPTY_MODEL } })}>
                        <Plus size={14} /> Tambah Model
                      </BrutalButton>
                    </div>
                  )}
                </div>
              )}
            </BrutalCard>
          );
        })
      )}
    </div>
  );
}
