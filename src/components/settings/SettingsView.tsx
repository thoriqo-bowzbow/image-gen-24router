'use client';

import { useState, useEffect, useCallback } from 'react';
import { providersApi } from '@/lib/api';
import type { ProviderSummary, ModelInfo } from '@/lib/api';
import {
  BrutalButton,
  BrutalInput,
  BrutalCard,
  BrutalBadge,
} from '@/components/NeoBrutalistUI';
import { Plus, Trash2, Pencil, X, Loader2, PlugZap, Check, AlertCircle } from 'lucide-react';

interface ProviderFields {
  name: string;
  baseUrl: string;
  apiKey: string;
  enhanceModel: string;
}

const EMPTY_FIELDS: ProviderFields = { name: '', baseUrl: '', apiKey: '', enhanceModel: '' };

interface FormModelState {
  id: string;
  owned_by: string;
  description: string;
  max_image_size: string;
  step_min: string;
  step_max: string;
  cfg_min: string;
  cfg_max: string;
  max_batch: string;
}

const EMPTY_MODEL: FormModelState = {
  id: '',
  owned_by: '',
  description: '',
  max_image_size: '1024x1024',
  step_min: '',
  step_max: '',
  cfg_min: '',
  cfg_max: '',
  max_batch: '',
};

function modelToForm(m: ModelInfo): FormModelState {
  return {
    id: m.id,
    owned_by: m.owned_by || '',
    description: m.description || '',
    max_image_size: m.max_image_size || '',
    step_min: m.step_range ? String(m.step_range[0]) : '',
    step_max: m.step_range ? String(m.step_range[1]) : '',
    cfg_min: m.cfg_range ? String(m.cfg_range[0]) : '',
    cfg_max: m.cfg_range ? String(m.cfg_range[1]) : '',
    max_batch: m.max_batch !== undefined ? String(m.max_batch) : '',
  };
}

function formToModel(f: FormModelState): ModelInfo {
  const m: ModelInfo = { id: f.id.trim(), object: 'model', owned_by: f.owned_by.trim() || 'custom' };
  if (f.description.trim()) m.description = f.description.trim();
  if (f.max_image_size.trim()) m.max_image_size = f.max_image_size.trim();
  const stepMin = Number(f.step_min);
  const stepMax = Number(f.step_max);
  if (f.step_min !== '' && f.step_max !== '' && !Number.isNaN(stepMin) && !Number.isNaN(stepMax)) {
    m.step_range = [stepMin, stepMax];
  }
  const cfgMin = Number(f.cfg_min);
  const cfgMax = Number(f.cfg_max);
  if (f.cfg_min !== '' && f.cfg_max !== '' && !Number.isNaN(cfgMin) && !Number.isNaN(cfgMax)) {
    m.cfg_range = [cfgMin, cfgMax];
  }
  const maxBatch = Number(f.max_batch);
  if (f.max_batch !== '' && !Number.isNaN(maxBatch)) m.max_batch = maxBatch;
  return m;
}

function numRange(r?: [number, number]): string {
  return r ? `${r[0]}–${r[1]}` : '-';
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

  const load = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await providersApi.list();
      setProviders(data.providers);
      setActiveId(data.activeProviderId);
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
    setFields({ name: p.name, baseUrl: p.baseUrl, apiKey: '', enhanceModel: p.enhanceModel || '' });
    setEditId(p.id);
    setFormMode('edit');
    setFormError(null);
  };

  const handleSaveProvider = async () => {
    setFormError(null);
    if (!fields.name.trim()) return setFormError('Nama wajib diisi.');
    if (!/^https?:\/\//i.test(fields.baseUrl.trim())) {
      return setFormError('Base URL harus diawali http:// atau https://.');
    }
    setSaving(true);
    try {
      if (formMode === 'new') {
        await providersApi.create({
          name: fields.name,
          baseUrl: fields.baseUrl,
          ...(fields.apiKey ? { apiKey: fields.apiKey } : {}),
          enhanceModel: fields.enhanceModel,
        });
      } else if (editId) {
        await providersApi.update(editId, {
          name: fields.name,
          baseUrl: fields.baseUrl,
          ...(fields.apiKey ? { apiKey: fields.apiKey } : {}),
          enhanceModel: fields.enhanceModel,
        });
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

  const runTest = async (key: string, input: { providerId?: string; baseUrl?: string; apiKey?: string }) => {
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
              <BrutalInput
                label="Base URL"
                placeholder="https://api.provider.com"
                value={fields.baseUrl}
                onChange={(e) => setFields((f) => ({ ...f, baseUrl: e.target.value }))}
              />
              <BrutalInput
                label="API Key (opsional)"
                type="password"
                placeholder={formMode === 'edit' ? 'kosongkan untuk tidak mengubah' : 'kosongkan jika tidak perlu'}
                value={fields.apiKey}
                onChange={(e) => setFields((f) => ({ ...f, apiKey: e.target.value }))}
              />
              <BrutalInput
                label="Enhance Model (opsional)"
                placeholder="mis. model-chat-gpt-4o"
                value={fields.enhanceModel}
                onChange={(e) => setFields((f) => ({ ...f, enhanceModel: e.target.value }))}
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
              {fields.baseUrl.trim() && (
                <BrutalButton
                  size="sm"
                  onClick={() => runTest('__form__', { baseUrl: fields.baseUrl, apiKey: fields.apiKey || undefined })}
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
            <BrutalCard key={p.id} className={isActive ? '!border-[var(--fg)]' : ''}>
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
                    API key: {p.hasApiKey ? 'tersimpan' : 'tidak ada'} · enhance: {p.enhanceModel || '-'} · {p.models.length} model
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
                  {!isActive && (
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
                          {m.owned_by} · size {m.max_image_size || '-'} · steps {numRange(m.step_range)} · cfg{' '}
                          {numRange(m.cfg_range)} · batch ≤ {m.max_batch ?? '-'}
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <BrutalInput
                          label="Model ID"
                          placeholder="mis. flux-1-schnell"
                          value={modelForm.state.id}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, id: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Owner / Label"
                          placeholder="mis. black-forest-labs"
                          value={modelForm.state.owned_by}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, owned_by: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Deskripsi"
                          value={modelForm.state.description}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, description: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Max Image Size"
                          placeholder="1024x1024"
                          value={modelForm.state.max_image_size}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, max_image_size: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Steps (min–max)"
                          placeholder="1"
                          value={modelForm.state.step_min}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, step_min: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Steps max"
                          placeholder="4"
                          value={modelForm.state.step_max}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, step_max: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="CFG min"
                          placeholder="1"
                          value={modelForm.state.cfg_min}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, cfg_min: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="CFG max"
                          placeholder="5"
                          value={modelForm.state.cfg_max}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, cfg_max: e.target.value } })
                          }
                        />
                        <BrutalInput
                          label="Max Batch"
                          placeholder="4"
                          value={modelForm.state.max_batch}
                          onChange={(e) =>
                            setModelForm((f) => f && { ...f, state: { ...f.state, max_batch: e.target.value } })
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
