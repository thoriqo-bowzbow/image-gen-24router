import { NextRequest, NextResponse } from 'next/server';
import { readProvidersFile, writeProvidersFile, slugify, uniqueSlug, getEnhanceConfig } from '@/lib/providers/store';
import { sanitizeModels, resolveBaseUrl } from '@/lib/providers/validate';
import { toSummary } from '@/lib/providers/types';
import type { ProviderConfig, ProviderProtocol } from '@/lib/providers/types';

function parseProtocol(raw: unknown): ProviderProtocol {
  if (raw === 'google-gemini') return 'google-gemini';
  if (raw === 'cloudflare-workers-ai') return 'cloudflare-workers-ai';
  return 'openai-compatible';
}

export async function GET() {
  const data = await readProvidersFile();
  const enhance = await getEnhanceConfig();
  return NextResponse.json({
    activeProviderId: data.activeProviderId,
    enhance,
    providers: data.providers.map(toSummary),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name wajib diisi' }, { status: 400 });
    }

    const data = await readProvidersFile();
    const protocol = parseProtocol(body.protocol);
    const provider: ProviderConfig = {
      id: uniqueSlug(slugify(name), data.providers),
      name,
      baseUrl: resolveBaseUrl(body.baseUrl, protocol),
      protocol: protocol,
      accountId: typeof body.accountId === 'string' && body.accountId.trim() ? body.accountId.trim() : undefined,
      apiKey: typeof body.apiKey === 'string' && body.apiKey ? body.apiKey : undefined,
      enhanceModel:
        typeof body.enhanceModel === 'string' && body.enhanceModel.trim()
          ? body.enhanceModel.trim()
          : undefined,
      models: sanitizeModels(body.models),
    };

    data.providers.push(provider);
    if (!data.activeProviderId) {
      data.activeProviderId = provider.id;
    }
    await writeProvidersFile(data);

    return NextResponse.json({ provider: toSummary(provider) }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 400 }
    );
  }
}
