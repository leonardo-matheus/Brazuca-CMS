'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    description: 'Perfeito para projetos pessoais e pequenos sites.',
    price: 0,
    popular: false,
    features: [
      '1 projeto',
      '3 usuários',
      '10.000 requisições/mês',
      '1GB de armazenamento',
      'API RESTful',
      'Suporte por email',
    ],
    cta: 'Começar Grátis',
    ctaVariant: 'outline' as const,
  },
  {
    name: 'Pro',
    description: 'Ideal para equipes e projetos em crescimento.',
    price: 99,
    popular: true,
    features: [
      '5 projetos',
      '10 usuários',
      '100.000 requisições/mês',
      '25GB de armazenamento',
      'API RESTful + GraphQL',
      'Webhooks ilimitados',
      'Suporte prioritário',
      'Backup diário',
    ],
    cta: 'Assinar Pro',
    ctaVariant: 'gradient' as const,
  },
  {
    name: 'Enterprise',
    description: 'Para grandes organizações com necessidades avançadas.',
    price: null,
    popular: false,
    features: [
      'Projetos ilimitados',
      'Usuários ilimitados',
      'Requisições ilimitadas',
      'Armazenamento ilimitado',
      'Todas as APIs',
      'SLA garantido',
      'Suporte 24/7',
      'Deploy on-premise',
      'SSO / SAML',
    ],
    cta: 'Falar com Vendas',
    ctaVariant: 'outline' as const,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = React.useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="py-20 lg:py-32 bg-gray-50/50 dark:bg-dark-925 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-brand-green-500/5 via-transparent to-brand-yellow-500/5 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <span className="inline-flex items-center gap-2 text-brand-green-600 dark:text-brand-green-400 font-semibold mb-4 text-sm tracking-wider">
            <span className="w-8 h-px bg-brand-green-500" />
            PREÇOS
            <span className="w-8 h-px bg-brand-green-500" />
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 dark:text-dark-50 mb-6">
            Planos para{' '}
            <span className="text-gradient">todos os tamanhos</span>
          </h2>
          <p className="text-lg text-dark-500 dark:text-dark-400 mb-8">
            Comece gratuitamente e escale conforme seu projeto cresce. 
            Sem surpresas, sem taxas ocultas.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 bg-white dark:bg-dark-900 rounded-full p-1.5 shadow-lg shadow-dark-900/5 dark:shadow-dark-950/50 border border-gray-200 dark:border-dark-800">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
                !annual 
                  ? 'bg-brand-green-500 text-white shadow-md' 
                  : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2',
                annual 
                  ? 'bg-brand-green-500 text-white shadow-md' 
                  : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'
              )}
            >
              Anual
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full transition-colors',
                annual ? 'bg-white/20 text-white' : 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400'
              )}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl p-8 transition-all duration-500',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
                plan.popular
                  ? 'bg-gradient-to-b from-dark-900 to-dark-950 dark:from-dark-800 dark:to-dark-900 text-white md:scale-105 shadow-2xl shadow-dark-900/20 dark:shadow-dark-950/50 border border-dark-700 z-10'
                  : 'card-interactive bg-white dark:bg-dark-900'
              )}
              style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-brand-yellow-400 to-brand-yellow-500 text-dark-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-brand-yellow-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    MAIS POPULAR
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className={cn('text-xl font-bold mb-2', !plan.popular && 'text-dark-900 dark:text-dark-50')}>{plan.name}</h3>
                <p className={cn('text-sm', plan.popular ? 'text-dark-400' : 'text-dark-500 dark:text-dark-400')}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-8">
                {plan.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className={cn('text-5xl font-bold tracking-tight', !plan.popular && 'text-dark-900 dark:text-dark-50')}>
                      {formatCurrency(annual ? plan.price * 0.8 : plan.price)}
                    </span>
                    <span className={cn('text-sm', plan.popular ? 'text-dark-400' : 'text-dark-500 dark:text-dark-400')}>
                      /mês
                    </span>
                  </div>
                ) : (
                  <span className={cn('text-3xl font-bold', !plan.popular && 'text-dark-900 dark:text-dark-50')}>Sob consulta</span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li 
                    key={feature} 
                    className={cn(
                      'flex items-center gap-3 transition-all duration-300',
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    )}
                    style={{ transitionDelay: isVisible ? `${(index * 100) + (i * 50)}ms` : '0ms' }}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                      plan.popular 
                        ? 'bg-brand-green-500/20' 
                        : 'bg-brand-green-100 dark:bg-brand-green-900/30'
                    )}>
                      <Check
                        className={cn(
                          'w-3 h-3',
                          plan.popular ? 'text-brand-green-400' : 'text-brand-green-600 dark:text-brand-green-400'
                        )}
                      />
                    </div>
                    <span className={cn('text-sm', plan.popular ? 'text-dark-200' : 'text-dark-600 dark:text-dark-400')}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={plan.price === null ? '/contact' : '/register'}>
                <Button
                  variant={plan.ctaVariant}
                  className={cn(
                    'w-full group',
                    plan.popular && 'bg-white text-dark-900 hover:bg-dark-100 border-0'
                  )}
                >
                  <span className="relative z-10">{plan.cta}</span>
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
