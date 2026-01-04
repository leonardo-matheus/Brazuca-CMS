'use client';

import React from 'react';
import { useTheme } from '@/stores/theme.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { initTheme } = useTheme();

  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <>{children}</>;
}
