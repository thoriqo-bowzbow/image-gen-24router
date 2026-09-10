import { NextRequest, NextResponse } from 'next/server';
import type { ImageGenerateParams } from '@/lib/api';
import { getActiveProvider } from '@/lib/providers/store';
import { getAdapter, ProviderUpstreamError } from '@/lib/providers/adapter';

export async function POST(request: NextRequest) {
  try {
    const provider = await getActiveProvider();
    if (!provider) {
      return NextResponse.json(
        { error: 'Belum ada provider aktif. Tambahkan provider di halaman Settings.' },
        { status: 400 }
      );
    }

    const params = (await request.json().catch(() => null)) as ImageGenerateParams | null;
    if (!params || typeof params.model !== 'string' || typeof params.prompt !== 'string') {
      return NextResponse.json({ error: 'Missing model or prompt' }, { status: 400 });
    }

    const adapter = getAdapter(provider);
    const result = await adapter.generate(provider, params);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ProviderUpstreamError) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
