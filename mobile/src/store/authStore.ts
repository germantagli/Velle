import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isKYCComplete: boolean;
  needsMFA?: boolean;
  setAuth: (auth: Partial<AuthState>) => void;
  logout: () => void;
}

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  kycStatus: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isKYCComplete: false,
      needsMFA: false,
      setAuth: auth =>
        set(state => {
          const kyc = auth.user?.kycStatus ?? state.user?.kycStatus;
          const isKYCComplete =
            kyc === 'verified' || kyc === 'UNDER_REVIEW' || kyc === 'under_review';
          return {
            ...state,
            ...auth,
            isAuthenticated: !!auth.token,
            isKYCComplete: auth.user ? isKYCComplete : state.isKYCComplete,
          };
        }),
      logout: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isKYCComplete: false,
          needsMFA: false,
        }),
    }),
    {
      name: 'velle-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({
        token: s.token,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    },
  ),
);
