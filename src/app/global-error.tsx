'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, Clock, RefreshCw, Mail, Twitter, AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="pt-BR">
      <body className="bg-gray-900">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-yellow-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-brand-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Animated gears */}
            <div className="absolute top-20 right-20 opacity-10">
              <svg className="w-32 h-32 text-white animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
              </svg>
            </div>
            <div className="absolute bottom-20 left-20 opacity-10">
              <svg className="w-24 h-24 text-white animate-spin-slow-reverse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
              </svg>
            </div>
          </div>

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            {/* Maintenance Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-36 h-36 bg-gradient-to-br from-brand-yellow-400 to-brand-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-yellow-500/30 animate-bounce-slow">
                  <Wrench className="w-20 h-20 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Message */}
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 animate-fade-in">
              Estamos em Manutenção
            </h1>
            
            <p className="text-xl text-gray-300 mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Trabalhando para melhorar sua experiência{dots}
            </p>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-brand-yellow-400 animate-pulse" />
                <span className="text-2xl font-bold text-white">Voltaremos em breve!</span>
              </div>
              <p className="text-gray-400">
                Nossos sistemas estão passando por uma atualização programada. 
                Por favor, tente novamente em alguns minutos.
              </p>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-green-500 to-brand-yellow-500 rounded-full animate-progress" />
              </div>
              <p className="text-gray-500 text-sm mt-2">Progresso da manutenção...</p>
            </div>

            {/* Action Button */}
            <button
              onClick={reset}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-green-500 to-brand-green-600 hover:from-brand-green-600 hover:to-brand-green-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-green-500/25 animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
              Tentar Novamente
            </button>

            {/* Contact info */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <a href="mailto:suporte@brazuca.cms" className="flex items-center gap-2 hover:text-brand-green-400 transition-colors">
                <Mail className="w-4 h-4" />
                suporte@brazuca.cms
              </a>
              <a href="https://twitter.com/brazucacms" className="flex items-center gap-2 hover:text-brand-green-400 transition-colors">
                <Twitter className="w-4 h-4" />
                @brazucacms
              </a>
            </div>
          </div>

          <style jsx>{`
            @keyframes bounce-slow {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-15px) rotate(-5deg); }
            }
            
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
            @keyframes spin-slow-reverse {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
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
            
            @keyframes progress {
              0% { width: 0%; }
              50% { width: 70%; }
              100% { width: 95%; }
            }
            
            .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
            .animate-spin-slow { animation: spin-slow 20s linear infinite; }
            .animate-spin-slow-reverse { animation: spin-slow-reverse 15s linear infinite; }
            .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
            .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
            .animate-progress { animation: progress 3s ease-in-out infinite; }
          `}</style>
        </div>
      </body>
    </html>
  );
}
