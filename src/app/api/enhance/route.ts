import { NextRequest, NextResponse } from 'next/server';
import { getEnhanceTarget } from '@/lib/providers/store';
import { resolveApiKey } from '@/lib/providers/adapter';

const SYSTEM_PROMPT = `You are a text-to-image prompt engineer. Your ONLY job: transform short user prompts into detailed English prompts for AI image generation.

RULES:
1. Return ONLY the enhanced prompt — single paragraph, comma-separated descriptive phrases.
2. NEVER explain, greet, comment, or ask questions. NO markdown, NO quotes.
3. Always translate non-English to English.
4. Include 3-5 of these elements: subject detail, art style, lighting, composition, colors, mood, quality tags.

FORMAT: [subject], [style], [lighting], [composition], [colors], [mood], [quality]

EXAMPLE:
Input: kucing lucu
Output: Adorable orange tabby kitten with bright green eyes, sitting on sunlit windowsill, warm golden hour lighting, shallow depth of field, bokeh background, cozy atmosphere, DSLR photography, highly detailed`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const target = await getEnhanceTarget();
    if (!target) {
      return NextResponse.json(
        { error: 'Belum ada konfigurasi Prompt Enhancer. Atur provider + model enhance di halaman Settings.' },
        { status: 400 }
      );
    }
    const provider = target.provider;
    const enhanceModel = target.model;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = resolveApiKey(provider);
    // Normalisasi: beberapa user mengisi baseUrl yang sudah diakhiri /v1
    const baseUrl = provider.baseUrl.replace(/\/+$/, '').replace(/\/v1$/i, '');

    let enhanceRes: Response;

    if (provider.protocol === 'cloudflare-workers-ai') {
      const accountId = provider.accountId?.trim();
      if (!accountId || !apiKey) {
        return NextResponse.json(
          { error: `Provider "${provider.name}" (Cloudflare) butuh Account ID dan API Token. Isi di Settings.` },
          { status: 400 }
        );
      }
      try {
        enhanceRes = await fetch(
          `${baseUrl}/accounts/${encodeURIComponent(accountId)}/ai/run/${enhanceModel}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt },
              ],
              max_tokens: 1000,
              temperature: 0.3,
            }),
          }
        );
      } catch {
        return NextResponse.json(
          { error: `Tidak bisa menghubungi provider di ${provider.baseUrl}` },
          { status: 502 }
        );
      }

      if (!enhanceRes.ok) {
        const errText = await enhanceRes.text().catch(() => '');
        return NextResponse.json(
          { error: `Enhance failed: ${enhanceRes.status} ${errText}` },
          { status: 502 }
        );
      }

      const cfData = await enhanceRes.json();
      const enhanced: string = cfData.result?.response?.trim();
      if (!enhanced) {
        return NextResponse.json({ error: 'Empty enhancement response' }, { status: 502 });
      }
      return NextResponse.json({ enhanced });
    }

    if (provider.protocol === 'google-gemini') {
      if (!apiKey) {
        return NextResponse.json(
          { error: `Provider "${provider.name}" (Google Gemini) butuh API key. Isi di Settings.` },
          { status: 400 }
        );
      }
      try {
        enhanceRes = await fetch(`${baseUrl}/models/${encodeURIComponent(enhanceModel)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
        });
      } catch {
        return NextResponse.json(
          { error: `Tidak bisa menghubungi provider di ${provider.baseUrl}` },
          { status: 502 }
        );
      }

      if (!enhanceRes.ok) {
        const errText = await enhanceRes.text().catch(() => '');
        return NextResponse.json(
          { error: `Enhance failed: ${enhanceRes.status} ${errText}` },
          { status: 502 }
        );
      }

      const geminiData = await enhanceRes.json();
      const enhanced: string = (geminiData.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string }) => p.text || '')
        .join('')
        .trim();
      if (!enhanced) {
        return NextResponse.json({ error: 'Empty enhancement response' }, { status: 502 });
      }
      return NextResponse.json({ enhanced });
    }

    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const enhanceUrl = `${baseUrl}/v1/chat/completions`;
    try {
      enhanceRes = await fetch(enhanceUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: enhanceModel,
          stream: false,
          temperature: 0.3,
          max_tokens: 1000,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
      });
    } catch {
      return NextResponse.json(
        { error: `Tidak bisa menghubungi provider di ${provider.baseUrl}` },
        { status: 502 }
      );
    }

    if (!enhanceRes.ok) {
      const errText = await enhanceRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Enhance failed: ${enhanceRes.status} ${errText}` },
        { status: 502 }
      );
    }

    const data = await enhanceRes.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();
    if (!enhanced) {
      return NextResponse.json({ error: 'Empty enhancement response' }, { status: 502 });
    }

    return NextResponse.json({ enhanced });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
