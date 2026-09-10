import { NextRequest, NextResponse } from 'next/server';
import { readProvidersFile, writeProvidersFile, getEnhanceConfig } from '@/lib/providers/store';

export async function GET() {
  return NextResponse.json(await getEnhanceConfig());
}

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { providerId?: string; model?: string }
    | null;
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const providerId = typeof body.providerId === 'string' && body.providerId.trim() ? body.providerId.trim() : null;
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : null;

  if (providerId && !model) {
    return NextResponse.json(
      { error: 'Enhance model wajib diisi jika provider enhance dipilih.' },
      { status: 400 }
    );
  }

  const data = await readProvidersFile();
  if (providerId && !data.providers.some((p) => p.id === providerId)) {
    return NextResponse.json({ error: 'Provider enhance tidak ditemukan' }, { status: 404 });
  }

  data.enhanceProviderId = providerId;
  data.enhanceModelId = model;
  await writeProvidersFile(data);

  return NextResponse.json({ providerId, model });
}
