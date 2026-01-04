'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2, Github, Chrome, Info, ChevronDown } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Usuários de teste do backend
const TEST_USERS = [
  { email: 'admin@brazucacms.com', password: 'admin123', role: 'SUPER_ADMIN', company: 'Sistema' },
  { email: 'carlos@techsolutions.com', password: 'carlos123', role: 'COMPANY_OWNER', company: 'Tech Solutions' },
  { email: 'maria@techsolutions.com', password: 'maria123', role: 'ADMIN', company: 'Tech Solutions' },
  { email: 'joao@techsolutions.com', password: 'joao123', role: 'USER', company: 'Tech Solutions' },
  { email: 'stefani@teatro.com', password: 'stefani123', role: 'COMPANY_OWNER', company: 'Companhia de Teatro' },
  { email: 'pedro@teatro.com', password: 'pedro123', role: 'USER', company: 'Companhia de Teatro' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestUsers, setShowTestUsers] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const fillTestCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    toast.success('Credenciais preenchidas!');
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      console.log('[Login Page] Attempting login with:', data.email);
      await login(data);
      toast.success('Login realizado com sucesso!');
      
      // Get redirect URL from query params or default to dashboard
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/dashboard';
      
      // Small delay to ensure cookie is set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a full page reload to ensure middleware reads the new cookie
      window.location.href = redirectTo;
    } catch (error: any) {
      console.error('[Login Page] Login error:', error);
      toast.error(error.message || 'Erro ao fazer login');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 mb-2">
        Bem-vindo de volta!
      </h1>
      <p className="text-dark-500 dark:text-dark-400 mb-6">
        Entre na sua conta para continuar gerenciando seu conteúdo.
      </p>

      {/* Demo Credentials Box */}
      <div className="mb-6 p-4 rounded-xl bg-brand-green-50 dark:bg-brand-green-900/20 border border-brand-green-200 dark:border-brand-green-800/50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-green-600 dark:text-brand-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <button
              type="button"
              onClick={() => setShowTestUsers(!showTestUsers)}
              className="flex items-center gap-2 text-sm font-medium text-brand-green-800 dark:text-brand-green-300 mb-1 hover:underline"
            >
              👤 Usuários de Teste
              <ChevronDown className={`w-4 h-4 transition-transform ${showTestUsers ? 'rotate-180' : ''}`} />
            </button>
            
            {showTestUsers && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {TEST_USERS.map((user, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => fillTestCredentials(user.email, user.password)}
                    className="w-full text-left p-2 rounded-lg bg-white dark:bg-dark-800 hover:bg-brand-green-100 dark:hover:bg-brand-green-900/30 transition-colors"
                  >
                    <div className="text-xs font-medium text-dark-800 dark:text-dark-200">
                      {user.email}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-dark-500 dark:text-dark-400">{user.company}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-green-100 dark:bg-brand-green-900/50 text-brand-green-700 dark:text-brand-green-300">
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!showTestUsers && (
              <p className="text-xs text-brand-green-700 dark:text-brand-green-400">
                Clique para ver os usuários disponíveis para teste
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button variant="outline" className="w-full group">
          <Github className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
          GitHub
        </Button>
        <Button variant="outline" className="w-full group">
          <Chrome className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
          Google
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-dark-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-dark-900 text-dark-500 dark:text-dark-400">ou continue com email</span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 dark:border-dark-600 text-brand-green-600 focus:ring-brand-green-500 dark:bg-dark-800 transition-colors"
            />
            <span className="text-sm text-dark-600 dark:text-dark-400 group-hover:text-dark-900 dark:group-hover:text-dark-200 transition-colors">Lembrar de mim</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-brand-green-600 hover:text-brand-green-700 dark:text-brand-green-500 dark:hover:text-brand-green-400 transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-dark-500 dark:text-dark-400 mt-6">
        Não tem uma conta?{' '}
        <Link
          href="/register"
          className="text-brand-green-600 hover:text-brand-green-700 dark:text-brand-green-500 dark:hover:text-brand-green-400 font-medium transition-colors"
        >
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
