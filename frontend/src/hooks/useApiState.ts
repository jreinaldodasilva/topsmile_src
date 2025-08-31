// src/hooks/useApiState.ts
import { useState, useCallback } from 'react';
import type { Contact } from '../types/api';

/**
 * Lightweight reusable API state hook.
 * - execute takes an apiCall function and manages loading / error / data
 * - Designed to be simple and composable for specialized hooks below
 */

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiStateReturn<T> extends ApiState<T> {
  execute: (apiCall: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
}

export function useApiState<T = any>(initialData: T | null = null): UseApiStateReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null
  });

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      console.error('API Error:', error);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError
  };
}

/* ---------- Specialized hooks that use the `apiService` shape ---------- */

export function useDashboard() {
  const { data: stats, loading, error, execute, reset } = useApiState<any>(null);

  const fetchDashboardData = useCallback(async () => {
    const mod = await import('../services/apiService');
    const svc = (mod as any).apiService ?? mod.default;
    return execute(async () => {
      const response = await svc.dashboard.getStats();
      return response.data ?? null;
    });
  }, [execute]);

  return {
    stats,
    loading,
    error,
    fetchDashboardData,
    reset
  };
}

export function useContacts() {
  // contactsData can be either an array of contacts or an envelope { contacts: Contact[], total?: number }
  type ContactsState = Contact[] | { contacts: Contact[]; total?: number } | null;

  const { data: contactsData, loading, error, execute, setData, setError } = useApiState<ContactsState>(null);

  const fetchContacts = useCallback(async (filters: Record<string, any> = {}) => {
    const mod = await import('../services/apiService');
    const svc = (mod as any).apiService ?? mod.default;
    return execute(async () => {
      const response = await svc.contacts.getAll(filters);
      // normalize: if server returns array, keep array; else if returns envelope, return envelope
      return response.data ?? null;
    });
  }, [execute]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const mod = await import('../services/apiService');
    const svc = (mod as any).apiService ?? mod.default;
    try {
      const response = await svc.contacts.update(id, updates);
      const updated = response.data ?? null;

      // Update local state if present
      if (contactsData) {
        if (Array.isArray(contactsData)) {
          const updatedArr = (contactsData as Contact[]).map(c => ((c._id === id || (c as any).id === id) ? { ...c, ...(updated ?? {}) } : c));
          setData(updatedArr as unknown as ContactsState);
        } else if ('contacts' in (contactsData as any) && Array.isArray((contactsData as any).contacts)) {
          const env = contactsData as { contacts: Contact[]; total?: number };
          const updatedArr = env.contacts.map(c => ((c._id === id || (c as any).id === id) ? { ...c, ...(updated ?? {}) } : c));
          setData({ ...env, contacts: updatedArr } as ContactsState);
        }
      }

      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar contato';
      setError(msg);
      throw err;
    }
  }, [contactsData, setData, setError]);

  const deleteContact = useCallback(async (id: string) => {
    const mod = await import('../services/apiService');
    const svc = (mod as any).apiService ?? mod.default;
    try {
      await svc.contacts.delete(id);

      if (contactsData) {
        if (Array.isArray(contactsData)) {
          const updatedArr = (contactsData as Contact[]).filter(c => (c._id !== id && (c as any).id !== id));
          setData(updatedArr as unknown as ContactsState);
        } else if ('contacts' in (contactsData as any) && Array.isArray((contactsData as any).contacts)) {
          const env = contactsData as { contacts: Contact[]; total?: number };
          const updatedArr = env.contacts.filter(c => (c._id !== id && (c as any).id !== id));
          setData({ ...env, contacts: updatedArr, total: typeof env.total === 'number' ? Math.max(0, env.total - 1) : env.total } as ContactsState);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir contato';
      setError(msg);
      throw err;
    }
  }, [contactsData, setData, setError]);

  return {
    contactsData,
    loading,
    error,
    fetchContacts,
    updateContact,
    deleteContact
  };
}