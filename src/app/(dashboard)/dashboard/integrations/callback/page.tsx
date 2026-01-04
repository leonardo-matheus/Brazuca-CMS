'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { integrationsService } from '@/services/integrations.service';
import { FiCheck, FiX, FiLoader } from 'react-icons/fi';

export default function IntegrationCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Autorização negada: ${searchParams.get('error_description') || error}`);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Parâmetros inválidos');
      return;
    }

    try {
      // State contains the platform name
      const platform = state;
      const redirectUri = `${window.location.origin}/dashboard/integrations/callback`;

      await integrationsService.connectIntegration({
        platform,
        code,
        redirectUri,
      });

      setStatus('success');
      setMessage(`${platform} conectado com sucesso!`);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/integrations');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Erro ao conectar integração');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <FiLoader className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Conectando...</h2>
            <p className="text-gray-500">Aguarde enquanto finalizamos a conexão.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <FiCheck className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Conectado!</h2>
            <p className="text-gray-500">{message}</p>
            <p className="text-sm text-gray-400 mt-2">Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <FiX className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Erro na Conexão</h2>
            <p className="text-gray-500 mb-4">{message}</p>
            <Button onClick={() => router.push('/dashboard/integrations')}>
              Voltar para Integrações
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
