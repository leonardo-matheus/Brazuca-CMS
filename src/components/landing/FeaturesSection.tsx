'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Zap,
  Code2,
  Palette,
  Lock,
  Globe,
  Layers,
  Workflow,
  Cloud,
} from 'lucide-react';

const features = [
  {
    icon: Code2,
    title: 'API-First',
    description: 'API RESTful e GraphQL completa para integrar com qualquer frontend ou aplicativo.',
    color: 'green',
  },
  {
    icon: Palette,
    title: 'Editor Visual',
    description: 'Interface intuitiva de arrastar e soltar para criar e editar conteúdo facilmente.',
    color: 'yellow',
  },
  {
    icon: Layers,
    title: 'Modelos Flexíveis',
    description: 'Crie estruturas de conteúdo personalizadas com campos customizáveis.',
    color: 'green',
  },
  {
    icon: Lock,
    title: 'Segurança Avançada',
    description: 'Autenticação robusta, permissões granulares e criptografia de dados.',
    color: 'yellow',
  },
  {
    icon: Globe,
    title: 'Multi-idioma',
    description: 'Suporte nativo para localização e internacionalização do conteúdo.',
    color: 'green',
  },
  {
    icon: Cloud,
    title: 'CDN Global',
    description: 'Entrega rápida de assets e mídia com cache inteligente global.',
    color: 'yellow',
  },
  {
    icon: Workflow,
    title: 'Workflows',
    description: 'Fluxos de aprovação e publicação personalizados para sua equipe.',
    color: 'green',
  },
  {
    icon: Zap,
    title: 'Webhooks',
    description: 'Integre eventos em tempo real com seus sistemas e automações.',
    color: 'yellow',
  },
];

export function FeaturesSection() {
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
    <section 
      id="features" 
      ref={sectionRef}
      className="py-20 lg:py-32 bg-gray-50/50 dark:bg-dark-925 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-brand-green-500/5 to-transparent rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <span className="inline-flex items-center gap-2 text-brand-green-600 dark:text-brand-green-400 font-semibold mb-4 text-sm tracking-wider">
            <span className="w-8 h-px bg-brand-green-500" />
            RECURSOS
            <span className="w-8 h-px bg-brand-green-500" />
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 dark:text-dark-50 mb-6">
            Tudo que você precisa para{' '}
            <span className="text-gradient">gerenciar conteúdo</span>
          </h2>
          <p className="text-lg text-dark-500 dark:text-dark-400">
            Uma plataforma completa com todas as ferramentas para criar, 
            organizar e distribuir conteúdo de forma eficiente.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`card-interactive group p-6 transition-all duration-500 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: isVisible ? `${index * 75}ms` : '0ms' }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                  feature.color === 'green'
                    ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 group-hover:shadow-lg group-hover:shadow-brand-green-500/20'
                    : 'bg-brand-yellow-100 dark:bg-brand-yellow-900/30 text-brand-yellow-600 dark:text-brand-yellow-400 group-hover:shadow-lg group-hover:shadow-brand-yellow-500/20'
                }`}
              >
                <feature.icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="font-semibold text-lg text-dark-900 dark:text-dark-50 mb-2 group-hover:text-brand-green-600 dark:group-hover:text-brand-green-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-dark-500 dark:text-dark-400 text-sm leading-relaxed">
                {feature.description}
              </p>
              
              {/* Hover indicator */}
              <div className={`h-0.5 w-0 group-hover:w-12 mt-4 rounded-full transition-all duration-300 ${
                feature.color === 'green' ? 'bg-brand-green-500' : 'bg-brand-yellow-500'
              }`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
