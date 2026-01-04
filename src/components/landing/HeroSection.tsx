import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight, Zap, Shield, Globe, Play, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-brand-green-50/30 dark:from-dark-950 dark:via-dark-925 dark:to-dark-900" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-green-400/20 dark:bg-brand-green-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-yellow-400/20 dark:bg-brand-yellow-500/10 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-brand-green-500/5 to-brand-yellow-500/5 rounded-full blur-3xl" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(22 179 100 / 0.07)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm shadow-lg shadow-brand-green-500/5 border border-gray-200/80 dark:border-dark-700/80 rounded-full px-4 py-2 mb-8 opacity-0 animate-fade-in-down">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green-500" />
            </span>
            <span className="text-sm font-medium text-dark-600 dark:text-dark-300">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-brand-yellow-500" />
              Versão 2.0 disponível agora
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-dark-900 dark:text-dark-50 mb-6 opacity-0 animate-fade-in-up animation-delay-100">
            O CMS Headless{' '}
            <span className="text-gradient-animated">brasileiro</span>{' '}
            <br className="hidden sm:block" />
            para desenvolvedores{' '}
            <span className="relative inline-block">
              <span className="text-brand-yellow-500">modernos</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 4 150 4 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-brand-yellow-400/50" />
              </svg>
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-dark-500 dark:text-dark-400 mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up animation-delay-200 leading-relaxed">
            Crie, gerencie e distribua conteúdo para qualquer plataforma com 
            nossa API poderosa e interface intuitiva. Flexível, escalável e 
            100% brasileiro.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0 animate-fade-in-up animation-delay-300">
            <Link href="/register">
              <Button variant="gradient" size="xl" className="group btn-glow relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Começar Grátis
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="xl" className="group hover:border-brand-green-500/50 dark:hover:border-brand-green-500/50">
                <Play className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Ver Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16 opacity-0 animate-fade-in-up animation-delay-400">
            {[
              { icon: Zap, value: '99.9%', label: 'Uptime', color: 'green' },
              { icon: Shield, value: 'SOC 2', label: 'Certificado', color: 'yellow' },
              { icon: Globe, value: '5K+', label: 'Projetos Ativos', color: 'green' },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className="flex items-center gap-3 group"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${
                  stat.color === 'green' 
                    ? 'bg-brand-green-100 dark:bg-brand-green-900/30 group-hover:shadow-brand-green-500/20' 
                    : 'bg-brand-yellow-100 dark:bg-brand-yellow-900/30 group-hover:shadow-brand-yellow-500/20'
                }`}>
                  <stat.icon className={`w-5 h-5 ${
                    stat.color === 'green' 
                      ? 'text-brand-green-600 dark:text-brand-green-400' 
                      : 'text-brand-yellow-600 dark:text-brand-yellow-400'
                  }`} />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-dark-900 dark:text-dark-50">{stat.value}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Terminal Preview */}
        <div className="mt-20 lg:mt-28 opacity-0 animate-scale-up animation-delay-500">
          <div className="relative mx-auto max-w-4xl">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-green-500/20 via-brand-yellow-500/10 to-brand-green-500/20 rounded-2xl blur-2xl animate-pulse-soft" />
            
            {/* Terminal */}
            <div className="terminal relative">
              <div className="terminal-header">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors cursor-pointer" />
                </div>
                <span className="text-dark-500 text-xs ml-4 font-mono">api-example.js</span>
              </div>
              <div className="terminal-body">
                <pre className="text-sm leading-relaxed">
                  <code>
                    <span className="code-comment">// Buscar conteúdo do BrazucaCMS</span>{'\n'}
                    <span className="code-keyword">const</span> <span className="code-variable">response</span> <span className="code-punctuation">=</span> <span className="code-keyword">await</span> <span className="code-method">fetch</span><span className="code-bracket">(</span>{'\n'}
                    {'  '}<span className="code-string">'https://api.brazucacms.com/v1/content'</span><span className="code-punctuation">,</span>{'\n'}
                    {'  '}<span className="code-bracket">{'{'}</span>{'\n'}
                    {'    '}<span className="code-property">headers</span><span className="code-punctuation">:</span> <span className="code-bracket">{'{'}</span>{'\n'}
                    {'      '}<span className="code-string">'Authorization'</span><span className="code-punctuation">:</span> <span className="code-string">`Bearer {'$'}{'{'}API_KEY{'}'}`</span>{'\n'}
                    {'    '}<span className="code-bracket">{'}'}</span>{'\n'}
                    {'  '}<span className="code-bracket">{'}'}</span>{'\n'}
                    <span className="code-bracket">)</span><span className="code-punctuation">;</span>{'\n\n'}
                    <span className="code-keyword">const</span> <span className="code-bracket">{'{'}</span> <span className="code-variable">data</span><span className="code-punctuation">,</span> <span className="code-variable">meta</span> <span className="code-bracket">{'}'}</span> <span className="code-punctuation">=</span> <span className="code-keyword">await</span> <span className="code-variable">response</span><span className="code-punctuation">.</span><span className="code-method">json</span><span className="code-bracket">()</span><span className="code-punctuation">;</span>{'\n\n'}
                    <span className="code-variable">console</span><span className="code-punctuation">.</span><span className="code-method">log</span><span className="code-bracket">(</span><span className="code-variable">data</span><span className="code-bracket">)</span><span className="code-punctuation">;</span>{'\n'}
                    <span className="code-comment">// {'{'} posts: [...], total: 42 {'}'}</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in animation-delay-700">
        <div className="flex flex-col items-center gap-2 text-dark-400 dark:text-dark-500">
          <span className="text-xs font-medium">Role para explorar</span>
          <div className="w-5 h-8 border-2 border-current rounded-full flex justify-center pt-1">
            <div className="w-1 h-2 bg-current rounded-full animate-bounce-subtle" />
          </div>
        </div>
      </div>
    </section>
  );
}
