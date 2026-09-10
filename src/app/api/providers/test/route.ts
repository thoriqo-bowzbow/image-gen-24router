import { NextRequest, NextResponse } from 'next/server';
import { readProvidersFile } from '@/lib/providers/store';
import { sanitizeBaseUrl } from '@/lib/providers/validate';
import { resolveApiKey } from '@/lib/providers/adapter';

interface TestInput {
  providerId?: string;
  baseUrl?: string;
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as TestInput | null;
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body' });
  }

  try {
    let baseUrl: string;
    let apiKey: string;

    if (body.providerId) {
      const data = await readProvidersFile();
      const provider = data.providers.find((p) => p.id === body.providerId);
      if (!provider) {
        return NextResponse.json({ ok: false, message: 'Provider tidak ditemukan' });
      }
      baseUrl = provider.baseUrl;
      apiKey = resolveApiKey(provider);
    } else {
      baseUrl = sanitizeBaseUrl(body.baseUrl);
      apiKey = body.apiKey || '';
    }

    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/models`, {
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
