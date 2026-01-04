'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, Search, Compass } from 'lucide-react';

export default function NotFound() {
  const [countdown, setCountdown] = useState(5);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar se está logado (cookie)
    const hasAuthCookie = document.cookie.includes('brazuca_auth_token');
    setIsLoggedIn(hasAuthCookie);

    // Countdown e redirecionamento
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = hasAuthCookie ? '/dashboard' : '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-green-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-yellow-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[12rem] sm:text-[16rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-green-400 via-brand-yellow-400 to-brand-green-400 leading-none animate-gradient-x select-none">
            404
          </h1>
          
          {/* Glitch effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12rem] sm:text-[16rem] font-black text-brand-green-500/20 animate-glitch-1 select-none">404</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12rem] sm:text-[16rem] font-black text-brand-yellow-500/20 animate-glitch-2 select-none">404</span>
          </div>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Compass className="w-16 h-16 text-brand-green-400 animate-spin-slow" />
            <div className="absolute inset-0 w-16 h-16 bg-brand-green-400/20 rounded-full blur-xl animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 animate-fade-in-up">
          Página não encontrada
        </h2>
        <p className="text-gray-400 text-lg mb-8 animate-fade-in-up animation-delay-200">
          Ops! Parece que você se perdeu. A página que você está procurando não existe ou foi movida.
        </p>

        {/* Countdown */}
        <div className="mb-8 animate-fade-in-up animation-delay-400">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-700">
            <div className="w-2 h-2 bg-brand-green-400 rounded-full animate-pulse" />
            <span className="text-gray-300">
              Redirecionando em{' '}
              <span className="font-bold text-brand-green-400 tabular-nums">{countdown}</span>
              {' '}segundos...
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="group flex items-center gap-2 px-6 py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-green-500/25"
          >
            <Home className="w-5 h-5 group-hover:animate-bounce" />
            {isLoggedIn ? 'Ir para Dashboard' : 'Voltar ao Início'}
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold rounded-xl border border-gray-700 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
        </div>

        {/* Search suggestion */}
        <div className="mt-12 animate-fade-in-up animation-delay-800">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Dica: Verifique se o endereço está correto ou use o menu de navegação
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes glitch-1 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        
        @keyframes glitch-2 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(-2px, 2px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-gradient-x { 
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite; 
        }
        .animate-glitch-1 { animation: glitch-1 0.3s ease-in-out infinite; }
        .animate-glitch-2 { animation: glitch-2 0.3s ease-in-out infinite 0.1s; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animation-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animation-delay-400 { animation-delay: 0.4s; opacity: 0; }
        .animation-delay-600 { animation-delay: 0.6s; opacity: 0; }
        .animation-delay-800 { animation-delay: 0.8s; opacity: 0; }
      `}</style>
    </div>
  );
}
