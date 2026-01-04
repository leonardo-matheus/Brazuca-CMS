import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(34 197 94 / 0.3)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          }}
        />
      </div>

      {/* Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-green-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-yellow-500/20 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Pronto para revolucionar seu{' '}
          <span className="text-brand-green-400">gerenciamento de conteúdo</span>?
        </h2>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          Junte-se a milhares de desenvolvedores e empresas que já usam BrazucaCMS 
          para criar experiências digitais incríveis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button variant="gradient" size="xl">
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="white" size="xl">
              Explorar Documentação
            </Button>
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 pt-12 border-t border-gray-800">
          <p className="text-sm text-gray-500 mb-4">Usado por empresas inovadoras</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {/* Placeholder for company logos */}
            {['Company 1', 'Company 2', 'Company 3', 'Company 4', 'Company 5'].map((company) => (
              <div
                key={company}
                className="h-8 w-24 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
