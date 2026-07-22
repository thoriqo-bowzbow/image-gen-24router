'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const Gallery = dynamic(() => import('@/components/Gallery').then((m) => ({ default: m.Gallery })), {
  ssr: false,
});

export default function GalleryPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-1 text-xs font-mono underline underline-offset-4 w-fit"
      >
        <ArrowLeft size={14} /> Back to Generator
      </button>
      <Gallery
        onReRun={(data) => {
          localStorage.setItem('t2i-rerun', JSON.stringify(data));
          router.push('/');
        }}
      />
    </div>
  );
}