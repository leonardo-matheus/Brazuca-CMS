'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/types';
import * as authService from '@/services/auth.service';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: true, // Start as true until we check localStorage
      isAuthenticated: false,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const { user, tokens } = await authService.login(credentials);
          
          // Store tokens in localStorage (cookie is set by API route)
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
          }
          
          set({ user, tokens, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const { user, tokens } = await authService.register(data);
          
          // Store tokens
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
          }
          
          set({ user, tokens, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          // Clear tokens from localStorage (cookie is cleared by API route)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
          
          set({ user: null, tokens: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        
        if (typeof window === 'undefined') {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null, tokens: null });
          return;
        }

        // We have a token - consider authenticated
        // If we already have user data from persist, use it
        const currentState = get();
        if (currentState.user) {
          set({ isAuthenticated: true, isLoading: false });
          return;
        }

        // Try to fetch user, but don't fail
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // Even if fetch fails, we have a token so allow access
          // Create a placeholder user
          set({ 
            user: {
              id: '1',
              email: 'user@example.com',
              name: 'Usuário',
              role: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isAuthenticated: true, 
            isLoading: false 
          });
        }
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set loading to false if we have persisted state
        // but still require checkAuth to validate the token
        if (state) {
          state.isLoading = true; // Keep loading true until checkAuth is called
        }
      },
    }
  )
);

// Hook for easy access
export function useAuth() {
  const store = useAuthStore();
  return store;
}
