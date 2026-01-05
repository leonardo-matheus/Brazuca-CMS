'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Image,
  Box,
  Settings,
  Key,
  LogOut,
  ChevronLeft,
  Layers,
  Users,
  Building2,
  Crown,
  Tag,
  Webhook,
  CreditCard,
  Plug,
  Workflow,
} from 'lucide-react';
import { useAuth, useAuthStore } from '@/stores/auth.store';

interface SidebarLink {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string;
  roles?: string[]; // If defined, only show for these roles
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  
  // Normalize role for comparison
  const userRole = user?.role?.toUpperCase().replace('-', '_') || '';

  const mainLinks: SidebarLink[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/content-types', icon: Box, label: 'Tipos de Conteúdo' },
    { href: '/dashboard/entries', icon: FileText, label: 'Entradas', badge: '8' },
    { href: '/dashboard/media', icon: Image, label: 'Biblioteca de Mídia' },
    { href: '/dashboard/tags', icon: Tag, label: 'Tags' },
    { href: '/dashboard/api-keys', icon: Key, label: 'Chaves de API' },
    { href: '/dashboard/integrations', icon: Plug, label: 'Integrações' },
    { href: '/dashboard/automations', icon: Workflow, label: 'Automações' },
  ];

  const managementLinks: SidebarLink[] = [
    { 
      href: '/dashboard/users', 
      icon: Users, 
      label: 'Usuários',
      roles: ['SUPER_ADMIN', 'COMPANY_OWNER'] 
    },
    { 
      href: '/dashboard/companies', 
      icon: Building2, 
      label: 'Empresas',
      roles: ['SUPER_ADMIN'] 
    },
  ];

  const settingsLinks: SidebarLink[] = [
    { href: '/dashboard/settings/webhooks', icon: Webhook, label: 'Webhooks' },
    { href: '/dashboard/billing', icon: CreditCard, label: 'Faturamento' },
    { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href) ?? false;
  };

  // Filter links based on user role
  const filterLinksByRole = (links: SidebarLink[]) => {
    return links.filter(link => {
      if (!link.roles) return true; // No role restriction
      return link.roles.includes(userRole);
    });
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Check if any management links should be shown
  const visibleManagementLinks = filterLinksByRole(managementLinks);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
              Brazuca<span className="text-brand-green-500">CMS</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Main Links */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
              Principal
            </p>
            <ul className="space-y-1">
              {mainLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 dark:text-brand-green-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="flex-1">{link.label}</span>
                    {link.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Management Links (Role-based) */}
          {visibleManagementLinks.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                Gerenciamento
              </p>
              <ul className="space-y-1">
                {visibleManagementLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive(link.href)
                          ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 dark:text-brand-green-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      )}
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="flex-1">{link.label}</span>
                      {link.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-brand-green-100 dark:bg-brand-green-900/30 text-brand-green-600 dark:text-brand-green-400 rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Settings Links */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
              Configurações
            </p>
            <ul className="space-y-1">
              {settingsLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(link.href)
                        ? 'bg-brand-green-50 dark:bg-brand-green-900/20 text-brand-green-600 dark:text-brand-green-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
