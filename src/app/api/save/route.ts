import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { base64, filename } = await request.json();
    if (!base64 || typeof base64 !== 'string') {
      return NextResponse.json({ error: 'Missing base64 data' }, { status: 400 });
    }

    const safeName = (filename || `img_${Date.now()}.webp`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const hasilDir = join(process.cwd(), 'public', 'hasil');
    await mkdir(hasilDir, { recursive: true });

    const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/);
    let buffer: Buffer;
    let ext: string;

    if (matches) {
      ext = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      ext = 'png';
      buffer = Buffer.from(base64, 'base64');
    }

    const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName.replace(/\.[^.]+$/, '')}.${ext}`;
    const filePath = join(hasilDir, finalName);
    await writeFile(filePath, buffer);

    const url = `/hasil/${finalName}`;
    return NextResponse.json({ url, filename: finalName });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Save failed' },
      { status: 500 }
    );
  }
}