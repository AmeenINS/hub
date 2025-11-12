import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  roles: string[];
  avatar?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, rememberMe?: boolean) => void;
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
      login: (user, token, rememberMe = false) => {
        // Store token in cookie for middleware
        // If rememberMe is true, use 30 days, otherwise use session cookie (no expires)
        if (rememberMe) {
          Cookies.set('auth-token', token, { expires: 30, sameSite: 'strict' });
        } else {
          Cookies.set('auth-token', token, { sameSite: 'strict' }); // Session cookie
        }
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
        
        // Only sync cookie if it doesn't exist
        // This prevents overriding server-set cookies with rememberMe logic
        if (state?.token && !Cookies.get('auth-token')) {
          Cookies.set('auth-token', state.token, { sameSite: 'strict' });
        }
      },
    }
  )
);
