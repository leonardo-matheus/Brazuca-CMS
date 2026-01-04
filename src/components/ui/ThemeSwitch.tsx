'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/stores/theme.store';
import { cn } from '@/lib/utils';

interface ThemeSwitchProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeSwitch({ className, showLabel = false }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse', className)} />
    );
  }

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Claro' },
    { value: 'dark' as const, icon: Moon, label: 'Escuro' },
    { value: 'system' as const, icon: Monitor, label: 'Sistema' },
  ];

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
            theme === value
              ? 'bg-white dark:bg-gray-700 text-brand-green-600 dark:text-brand-green-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          )}
          title={label}
        >
          <Icon className="w-4 h-4" />
          {showLabel && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}

// Versão compacta com toggle simples
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse', className)} />
    );
  }

  const toggleTheme = () => {
    // Se está em system, vai para o oposto do tema atual
    // Se não, alterna entre light e dark
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-300',
        'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
        'text-gray-600 dark:text-gray-300',
        className
      )}
      title={resolvedTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300',
            resolvedTheme === 'dark'
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100'
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 w-5 h-5 transition-all duration-300',
            resolvedTheme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          )}
        />
      </div>
    </button>
  );
}

// Versão com dropdown para mais opções
export function ThemeDropdown({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse', className)} />
    );
  }

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Modo Claro' },
    { value: 'dark' as const, icon: Moon, label: 'Modo Escuro' },
    { value: 'system' as const, icon: Monitor, label: 'Usar Sistema' },
  ];

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
          'text-gray-600 dark:text-gray-300'
        )}
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-scale-in">
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                theme === value
                  ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 dark:text-brand-green-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {theme === value && (
                <span className="ml-auto w-2 h-2 rounded-full bg-brand-green-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
