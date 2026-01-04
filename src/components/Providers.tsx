'use client';

import React from 'react';
import { useAuth } from '@/stores/auth.store';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { checkAuth } = useAuth();

  // Verificar autenticação ao carregar a aplicação
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
