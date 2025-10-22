import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setLoading: (loading) => set({ isLoading: loading }),
      login: (user, token) => {
        // Store token in cookie for middleware
        Cookies.set('auth-token', token, { expires: 7, sameSite: 'strict' });
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        // Remove token from cookie
        Cookies.remove('auth-token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // When store is rehydrated, set loading to false
        state?.setLoading(false);
        
        // Sync cookie with store
        if (state?.token) {
          Cookies.set('auth-token', state.token, { expires: 7, sameSite: 'strict' });
        }
      },
    }
  )
);
