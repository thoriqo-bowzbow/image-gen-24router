import { NextRequest, NextResponse } from 'next/server';
import { readProvidersFile, writeProvidersFile } from '@/lib/providers/store';
import { sanitizeBaseUrl, sanitizeModels } from '@/lib/providers/validate';
import { toSummary } from '@/lib/providers/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const data = await readProvidersFile();
    const provider = data.providers.find((p) => p.id === id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider tidak ditemukan' }, { status: 404 });
    }

    if (typeof body.name === 'string' && body.name.trim()) {
      provider.name = body.name.trim();
    }
    if (typeof body.baseUrl === 'string' && body.baseUrl.trim()) {
      provider.baseUrl = sanitizeBaseUrl(body.baseUrl);
    }
    if (typeof body.apiKey === 'string' && body.apiKey) {
      provider.apiKey = body.apiKey;
    }
    if (typeof body.enhanceModel === 'string') {
      provider.enhanceModel = body.enhanceModel.trim() || undefined;
    }
    if (body.models !== undefined) {
      provider.models = sanitizeModels(body.models);
    }
    if (body.setActive === true) {
      data.activeProviderId = provider.id;
    }

    await writeProvidersFile(data);
    return NextResponse.json({ provider: toSummary(provider) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const data = await readProvidersFile();
  const idx = data.providers.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Provider tidak ditemukan' }, { status: 404 });
  }

  data.providers.splice(idx, 1);
  if (data.activeProviderId === id) {
    data.activeProviderId = data.providers[0]?.id ?? null;
  }
  await writeProvidersFile(data);

  return NextResponse.json({ ok: true, activeProviderId: data.activeProviderId });
}
