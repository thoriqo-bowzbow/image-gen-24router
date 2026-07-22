import { NextRequest, NextResponse } from 'next/server';

const TARGET = 'http://127.0.0.1:24024';

const API_KEY = process.env.T2I_API_KEY || '';

function makeHeaders() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) h['Authorization'] = `Bearer ${API_KEY}`;
  return h;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${TARGET}/${path.join('/')}${request.nextUrl.search}`;
  const res = await fetch(targetUrl, { headers: makeHeaders() });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${TARGET}/${path.join('/')}${request.nextUrl.search}`;
  const body = JSON.stringify(await request.json());
  const res = await fetch(targetUrl, { method: 'POST', headers: makeHeaders(), body });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}