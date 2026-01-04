'use client';

import { useEffect, useRef, useState } from 'react';
import { FileCode, Database, Rocket, Copy, Check } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileCode,
    title: 'Defina seus modelos',
    description: 'Crie estruturas de conteúdo flexíveis usando nosso editor visual ou via código.',
    color: 'green',
  },
  {
    number: '02',
    icon: Database,
    title: 'Adicione conteúdo',
    description: 'Use nosso editor intuitivo para criar e gerenciar seu conteúdo de forma colaborativa.',
    color: 'yellow',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Consuma via API',
    description: 'Integre o conteúdo em qualquer aplicação usando nossa API RESTful ou GraphQL.',
    color: 'green',
  },
];

export function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    const code = `// Buscar conteúdos via API
const response = await fetch(
  'https://api.brazucacms.io/v1/content/posts',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const posts = await response.json();
console.log(posts);`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section ref={sectionRef} className="py-20 lg:py-32 bg-white dark:bg-dark-950 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316b364' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <span className="inline-flex items-center gap-2 text-brand-green-600 dark:text-brand-green-400 font-semibold mb-4 text-sm tracking-wider">
            <span className="w-8 h-px bg-brand-green-500" />
            COMO FUNCIONA
            <span className="w-8 h-px bg-brand-green-500" />
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 dark:text-dark-50 mb-6">
            Simples como{' '}
            <span className="text-gradient">1, 2, 3</span>
          </h2>
          <p className="text-lg text-dark-500 dark:text-dark-400">
            Comece a gerenciar seu conteúdo em minutos com nossa plataforma 
            intuitiva e bem documentada.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.number} 
              className={`relative transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: isVisible ? `${index * 150}ms` : '0ms' }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`hidden md:block absolute top-12 left-1/2 w-full h-0.5 transition-all duration-1000 delay-500 ${
                  isVisible ? 'scale-x-100' : 'scale-x-0'
                } origin-left`}>
                  <div className="h-full bg-gradient-to-r from-brand-green-300 to-brand-yellow-300 dark:from-brand-green-700 dark:to-brand-yellow-700" />
                </div>
              )}

              <div className="card-interactive group relative p-8">
                {/* Number Badge */}
                <div
                  className={`absolute -top-4 left-8 px-4 py-1.5 rounded-full font-bold text-sm shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                    step.color === 'green'
                      ? 'bg-gradient-to-r from-brand-green-500 to-brand-green-600 text-white'
                      : 'bg-gradient-to-r from-brand-yellow-400 to-brand-yellow-500 text-dark-900'
                  }`}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 mt-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                    step.color === 'green'
                      ? 'bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 group-hover:shadow-lg group-hover:shadow-brand-green-500/20'
                      : 'bg-brand-yellow-100 dark:bg-brand-yellow-900/30 text-brand-yellow-600 dark:text-brand-yellow-400 group-hover:shadow-lg group-hover:shadow-brand-yellow-500/20'
                  }`}
                >
                  <step.icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-xl text-dark-900 dark:text-dark-50 mb-3 group-hover:text-brand-green-600 dark:group-hover:text-brand-green-400 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-dark-500 dark:text-dark-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Code Preview with Syntax Highlighting */}
        <div className={`mt-20 max-w-4xl mx-auto transition-all duration-700 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-green-500/20 to-brand-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="terminal relative">
              <div className="terminal-header justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors cursor-pointer" />
                  </div>
                  <span className="text-dark-500 text-xs font-mono">api-example.js</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-brand-green-400" />
                      <span className="text-brand-green-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <div className="terminal-body">
                <pre className="text-sm leading-relaxed">
                  <code>
                    <span className="code-comment">// Buscar conteúdos via API</span>{'\n'}
                    <span className="code-keyword">const</span> <span className="code-variable">response</span> <span className="code-punctuation">=</span> <span className="code-keyword">await</span> <span className="code-method">fetch</span><span className="code-bracket">(</span>{'\n'}
                    {'  '}<span className="code-string">'https://api.brazucacms.io/v1/content/posts'</span><span className="code-punctuation">,</span>{'\n'}
                    {'  '}<span className="code-bracket">{'{'}</span>{'\n'}
                    {'    '}<span className="code-property">headers</span><span className="code-punctuation">:</span> <span className="code-bracket">{'{'}</span>{'\n'}
                    {'      '}<span className="code-string">'Authorization'</span><span className="code-punctuation">:</span> <span className="code-string">'Bearer YOUR_API_KEY'</span><span className="code-punctuation">,</span>{'\n'}
                    {'      '}<span className="code-string">'Content-Type'</span><span className="code-punctuation">:</span> <span className="code-string">'application/json'</span>{'\n'}
                    {'    '}<span className="code-bracket">{'}'}</span>{'\n'}
                    {'  '}<span className="code-bracket">{'}'}</span>{'\n'}
                    <span className="code-bracket">)</span><span className="code-punctuation">;</span>{'\n\n'}
                    <span className="code-keyword">const</span> <span className="code-variable">posts</span> <span className="code-punctuation">=</span> <span className="code-keyword">await</span> <span className="code-variable">response</span><span className="code-punctuation">.</span><span className="code-method">json</span><span className="code-bracket">()</span><span className="code-punctuation">;</span>{'\n'}
                    <span className="code-variable">console</span><span className="code-punctuation">.</span><span className="code-method">log</span><span className="code-bracket">(</span><span className="code-variable">posts</span><span className="code-bracket">)</span><span className="code-punctuation">;</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
