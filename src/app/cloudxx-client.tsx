'use client';

import dynamic from 'next/dynamic';

const CloudxxDashboard = dynamic(() => import('../App'), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-black text-sm text-neutral-400">
      Đang tải Cloudxx…
    </main>
  ),
});

export function CloudxxClientApp() {
  return <CloudxxDashboard />;
}
