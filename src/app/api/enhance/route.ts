import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.T2I_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;

    const enhanceRes = await fetch('http://127.0.0.1:24024/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'PromptEnhancerForTextToImage-combo',
        stream: false,
        temperature: 0.3,
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `You are a text-to-image prompt engineer. Your ONLY job: transform short user prompts into detailed English prompts for AI image generation.

RULES:
1. Return ONLY the enhanced prompt — single paragraph, comma-separated descriptive phrases.
2. NEVER explain, greet, comment, or ask questions. NO markdown, NO quotes.
3. Always translate non-English to English.
4. Include 3-5 of these elements: subject detail, art style, lighting, composition, colors, mood, quality tags.

FORMAT: [subject], [style], [lighting], [composition], [colors], [mood], [quality]

EXAMPLE:
Input: kucing lucu
Output: Adorable orange tabby kitten with bright green eyes, sitting on sunlit windowsill, warm golden hour lighting, shallow depth of field, bokeh background, cozy atmosphere, DSLR photography, highly detailed`,
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

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