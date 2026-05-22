'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateModelConfig = useStore((s) => s.hydrateModelConfig);

  useEffect(() => {
    // Load fonts
    const fontLink = document.createElement('link');
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Hydrate model config from localStorage AFTER initial render
    hydrateModelConfig();
  }, [hydrateModelConfig]);

  return <>{children}</>;
}
