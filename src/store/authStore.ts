import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setInitializing: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isInitializing: !!localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isInitializing: false });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
  },
  setInitializing: (val) => set({ isInitializing: val }),
}));
