'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, getErrorMessage } from '@/lib/api';

// =============================================
// Workspace Store - Estado global do workspace
// =============================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

function mapWorkspace(ws: WorkspaceResponse): Workspace {
  return {
    id: String(ws.id),
    name: ws.name,
    slug: ws.slug,
    description: ws.description,
    createdAt: ws.createdAt,
    updatedAt: ws.updatedAt,
  };
}

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  selectWorkspaceById: (id: string) => void;
  createWorkspace: (data: { name: string; slug?: string; description?: string }) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  ensureWorkspace: () => Promise<string>;
  clearWorkspace: () => void;
  setInitialized: (value: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentWorkspace: null,
      workspaces: [],
      isLoading: false,
      isInitialized: false,
      error: null,

      setInitialized: (value: boolean) => set({ isInitialized: value }),

      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get<ApiResponse<PageResponse<WorkspaceResponse>>>('/api/workspaces', {
            params: { page: 0, limit: 100 },
          });
          
          const workspaces = response.data.data.content.map(mapWorkspace);
          
          const currentWorkspace = get().currentWorkspace;
          
          // Auto-select first workspace if none selected
          if (workspaces.length > 0 && !currentWorkspace) {
            set({ workspaces, currentWorkspace: workspaces[0], isLoading: false });
          } else if (currentWorkspace) {
            // Verify current workspace still exists
            const exists = workspaces.find((w: Workspace) => w.id === currentWorkspace.id);
            if (!exists && workspaces.length > 0) {
              set({ workspaces, currentWorkspace: workspaces[0], isLoading: false });
            } else {
              set({ workspaces, isLoading: false });
            }
          } else {
            set({ workspaces, isLoading: false });
          }
        } catch (error: any) {
          console.error('Error fetching workspaces:', error);
          set({ error: getErrorMessage(error) || 'Erro ao buscar workspaces', isLoading: false });
        }
      },

      setCurrentWorkspace: (workspace: Workspace) => {
        set({ currentWorkspace: workspace });
      },

      selectWorkspaceById: (id: string) => {
        const workspace = get().workspaces.find(w => w.id === id);
        if (workspace) {
          set({ currentWorkspace: workspace });
        }
      },

      createWorkspace: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<ApiResponse<WorkspaceResponse>>('/api/workspaces', data);
          const workspace = mapWorkspace(response.data.data);
          
          set(state => ({
            workspaces: [...state.workspaces, workspace],
            currentWorkspace: workspace,
            isLoading: false,
          }));
          
          return workspace;
        } catch (error: any) {
          const message = getErrorMessage(error) || 'Erro ao criar workspace';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      updateWorkspace: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put<ApiResponse<WorkspaceResponse>>(`/api/workspaces/${id}`, data);
          const updatedWorkspace = mapWorkspace(response.data.data);
          
          set(state => ({
            workspaces: state.workspaces.map(w => w.id === id ? updatedWorkspace : w),
            currentWorkspace: state.currentWorkspace?.id === id ? updatedWorkspace : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: any) {
          const message = getErrorMessage(error) || 'Erro ao atualizar workspace';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      deleteWorkspace: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete(`/api/workspaces/${id}`);
          
          set(state => {
            const newWorkspaces = state.workspaces.filter(w => w.id !== id);
            const newCurrent = state.currentWorkspace?.id === id 
              ? (newWorkspaces[0] || null)
              : state.currentWorkspace;
            
            return {
              workspaces: newWorkspaces,
              currentWorkspace: newCurrent,
              isLoading: false,
            };
          });
        } catch (error: any) {
          const message = getErrorMessage(error) || 'Erro ao deletar workspace';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      ensureWorkspace: async () => {
        const { currentWorkspace, fetchWorkspaces, createWorkspace, workspaces } = get();
        
        if (currentWorkspace?.id) {
          return currentWorkspace.id;
        }
        
        // Fetch workspaces if not loaded
        if (workspaces.length === 0) {
          await fetchWorkspaces();
        }
        
        const updatedWorkspaces = get().workspaces;
        const updatedCurrent = get().currentWorkspace;
        
        if (updatedCurrent?.id) {
          return updatedCurrent.id;
        }
        
        if (updatedWorkspaces.length > 0) {
          set({ currentWorkspace: updatedWorkspaces[0] });
          return updatedWorkspaces[0].id;
        }
        
        // Create default workspace
        try {
          const workspace = await createWorkspace({
            name: 'Default Workspace',
            slug: 'default',
            description: 'Workspace padrão do sistema',
          });
          return workspace.id;
        } catch (error) {
          console.error('Failed to create default workspace:', error);
          throw error;
        }
      },

      clearWorkspace: () => {
        set({ currentWorkspace: null, workspaces: [], error: null, isInitialized: false });
      },
    }),
    {
      name: 'brazuca-workspace-store',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

/**
 * Wait for workspace to be initialized
 * Returns the workspace ID or null if timeout
 */
export async function waitForWorkspace(timeoutMs = 10000): Promise<string | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const state = useWorkspaceStore.getState();
    
    if (state.currentWorkspace?.id) {
      return state.currentWorkspace.id;
    }
    
    if (state.isInitialized && !state.currentWorkspace) {
      // Initialized but no workspace - this is an error state
      return null;
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return null;
}

/**
 * Get current workspace ID or throw if not available
 */
export function getWorkspaceIdOrThrow(): number {
  const store = useWorkspaceStore.getState();
  if (!store.currentWorkspace?.id) {
    throw new Error('No workspace selected');
  }
  return Number(store.currentWorkspace.id);
}

/**
 * Get current workspace ID or null
 */
export function getWorkspaceIdOrNull(): number | null {
  const store = useWorkspaceStore.getState();
  if (!store.currentWorkspace?.id) {
    return null;
  }
  return Number(store.currentWorkspace.id);
}
