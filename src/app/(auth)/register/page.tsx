'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Loader2, Github, Chrome } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success('Conta criada com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Criar sua conta
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Comece gratuitamente e escale conforme seu projeto cresce.
      </p>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button variant="outline" className="w-full">
          <Github className="w-5 h-5 mr-2" />
          GitHub
        </Button>
        <Button variant="outline" className="w-full">
          <Chrome className="w-5 h-5 mr-2" />
          Google
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">ou crie com email</span>
        </div>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome completo"
          type="text"
          placeholder="João Silva"
          leftIcon={<User className="w-5 h-5" />}
          error={errors.name?.message}
          {...register('name')}
        />

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
          hint="Mínimo de 8 caracteres"
          {...register('password')}
        />

        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-brand-green-600 focus:ring-brand-green-500 dark:bg-gray-800"
            required
          />
          <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
            Eu concordo com os{' '}
            <Link href="/terms" className="text-brand-green-600 dark:text-brand-green-500 hover:underline">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacy" className="text-brand-green-600 dark:text-brand-green-500 hover:underline">
              Política de Privacidade
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta grátis'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        Já tem uma conta?{' '}
        <Link
          href="/login"
          className="text-brand-green-600 hover:text-brand-green-700 dark:text-brand-green-500 dark:hover:text-brand-green-400 font-medium"
        >
          Fazer login
        </Link>
      </p>
    </div>
  );
}
