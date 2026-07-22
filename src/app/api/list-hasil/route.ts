import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const hasilDir = join(process.cwd(), 'public', 'hasil');
    const files = await readdir(hasilDir);
    const entries = await Promise.all(
      files
        .filter((f) => /\.(webp|png|jpg|jpeg|gif)$/i.test(f))
        .map(async (name) => {
          const fullPath = join(hasilDir, name);
          const stats = await stat(fullPath);
          return {
            name,
            size: stats.size,
            url: `/hasil/${name}`,
            mtime: stats.mtimeMs,
          };
        })
    );
    entries.sort((a, b) => b.mtime - a.mtime);
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}