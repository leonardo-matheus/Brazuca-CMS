'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para debugging
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center animate-bounce-slow shadow-2xl shadow-red-500/30">
              <AlertTriangle className="w-16 h-16 text-white" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 w-32 h-32 bg-red-500/20 rounded-3xl animate-ping" />
            <div className="absolute -inset-4 border-2 border-red-500/20 rounded-[2rem] animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 animate-fade-in">
          Ops! Algo deu errado
        </h1>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bug className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Erro do Sistema</span>
          </div>
          <p className="text-gray-300 text-lg mb-4">
            Encontramos um problema inesperado. Nossa equipe já foi notificada e está trabalhando para resolver.
          </p>
          {error.digest && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-lg">
              <span className="text-gray-500 text-sm">Código do erro:</span>
              <code className="text-red-400 text-sm font-mono">{error.digest}</code>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={reset}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-green-500 to-brand-green-600 hover:from-brand-green-600 hover:to-brand-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-green-500/25"
          >
            <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
            Tentar Novamente
          </button>
          
          <a
            href="/dashboard"
            className="group flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold rounded-xl border border-gray-700 transition-all duration-300 hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Ir para Dashboard
          </a>
          
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold rounded-xl border border-gray-700 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
        </div>

        {/* Support info */}
        <p className="mt-8 text-gray-500 text-sm animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          Se o problema persistir, entre em contato com o suporte em{' '}
          <a href="mailto:suporte@brazuca.cms" className="text-brand-green-400 hover:underline">
            suporte@brazuca.cms
          </a>
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
