'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar, DashboardNavbar } from '@/components/layout';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const { isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const { fetchWorkspaces, ensureWorkspace, setInitialized } = useWorkspaceStore();

  // Initialize everything on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check authentication first
        await checkAuth();
        
        const authState = useAuthStore.getState();
        if (!authState.isAuthenticated) {
          setIsReady(true);
          return;
        }

        // Try to fetch workspaces, but don't block on failure
        try {
          await fetchWorkspaces();
          const state = useWorkspaceStore.getState();
          if (!state.currentWorkspace) {
            await ensureWorkspace();
          }
        } catch (error) {
          console.warn('Failed to initialize workspace:', error);
        }
        
        setInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []); // Run only once on mount

  // Show loading while initializing
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, show message (middleware should redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
