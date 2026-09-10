import { NextRequest, NextResponse } from 'next/server';
import { readProvidersFile } from '@/lib/providers/store';
import { resolveBaseUrl, CF_DEFAULT_BASE_URL } from '@/lib/providers/validate';
import { resolveApiKey } from '@/lib/providers/adapter';

interface TestInput {
  providerId?: string;
  protocol?: string;
  baseUrl?: string;
  apiKey?: string;
  accountId?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as TestInput | null;
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body' });
  }

  try {
    let baseUrl: string;
    let apiKey: string;
    let protocol: string;
    let accountId: string | undefined;

    if (body.providerId) {
      const data = await readProvidersFile();
      const provider = data.providers.find((p) => p.id === body.providerId);
      if (!provider) {
        return NextResponse.json({ ok: false, message: 'Provider tidak ditemukan' });
      }
      baseUrl = provider.baseUrl;
      apiKey = resolveApiKey(provider);
      protocol = provider.protocol;
      accountId = provider.accountId;
    } else {
      protocol = body.protocol === 'google-gemini' ? 'google-gemini' : body.protocol === 'cloudflare-workers-ai' ? 'cloudflare-workers-ai' : 'openai-compatible';
      baseUrl = resolveBaseUrl(body.baseUrl, protocol);
      apiKey = body.apiKey || '';
      accountId = body.accountId;
    }

    const headers: Record<string, string> = {};
    let modelsPath = '/v1/models';
    if (protocol === 'google-gemini') {
      if (apiKey) headers['x-goog-api-key'] = apiKey;
      modelsPath = '/models';
    } else if (protocol === 'cloudflare-workers-ai') {
      if (!accountId) {
        return NextResponse.json({ ok: false, message: 'Account ID Cloudflare wajib diisi untuk test koneksi.' });
      }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      baseUrl = (baseUrl || CF_DEFAULT_BASE_URL).replace(/\/+$/, '');
      modelsPath = `/accounts/${encodeURIComponent(accountId)}/ai/models/search?per_page=1`;
    } else {
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      baseUrl = baseUrl.replace(/\/+$/, '').replace(/\/v1$/i, '');
    }
    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/+$/, '')}${modelsPath}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(8000),
      });
    } catch (e) {
      return NextResponse.json({
        ok: false,
        message: `Tidak bisa menghubungi ${baseUrl}: ${e instanceof Error ? e.message : 'network error'}`,
      });
    }

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        status: res.status,
        message: `Host merespon tapi HTTP ${res.status}. Cek baseUrl / API key.`,
      });
    }

    const data = (await res.json().catch(() => null)) as { data?: unknown } | null;
    const count = Array.isArray(data?.data) ? data!.data!.length : 0;
    return NextResponse.json({
      ok: true,
      status: res.status,
      message: count
        ? `Koneksi OK — ${count} model terdaftar di /v1/models`
        : 'Koneksi OK — endpoint /v1/models tidak mengembalikan daftar model (tidak masalah, model bisa ditambah manual)',
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      message: e instanceof Error ? e.message : 'Internal error',
    });
  }
}
