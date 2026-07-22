'use client';

import dynamic from 'next/dynamic';

const Generator = dynamic(() => import('@/components/Generator').then((m) => ({ default: m.Generator })), {
  ssr: false,
});

export default function Home() {
  return <Generator />;
}