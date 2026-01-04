'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, ThemeToggle } from '@/components/ui';
import { Menu, X, ArrowRight } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/#features', label: 'Recursos' },
    { href: '/#pricing', label: 'Preços' },
    { href: '/docs', label: 'Docs' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'glass shadow-lg shadow-dark-900/5 dark:shadow-dark-950/20 border-b border-gray-200/50 dark:border-dark-700/50'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-brand-green-500/20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-display font-bold text-xl text-dark-900 dark:text-dark-50">
              Brazuca<span className="text-brand-green-500">CMS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  pathname === link.href
                    ? 'text-brand-green-600 dark:text-brand-green-400 bg-brand-green-50 dark:bg-brand-green-900/20'
                    : 'text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:hover:text-dark-50 hover:bg-gray-100 dark:hover:bg-dark-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-gray-100 dark:hover:bg-dark-800">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" className="group">
                Começar Grátis
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 text-dark-600 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden glass border-t border-gray-200/50 dark:border-dark-700/50 animate-fade-in-down">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t dark:border-gray-800 space-y-2">
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">
                  Entrar
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button variant="primary" className="w-full">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
