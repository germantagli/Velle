import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearStoredCredentials} from '../services/biometric';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isKYCComplete: boolean;
  kycSkipped?: boolean;
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
  mfaEnabled?: boolean;
  notificationsEnabled?: boolean;
  passwordSet?: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isKYCComplete: false,
      kycSkipped: false,
      needsMFA: false,
      setAuth: auth =>
        set(state => {
          const kyc = auth.user?.kycStatus ?? state.user?.kycStatus;
          const isKYCComplete =
            kyc === 'verified' || kyc === 'UNDER_REVIEW' || kyc === 'under_review';
          const isAuthenticated =
            auth.token !== undefined ? !!auth.token : state.isAuthenticated;
          return {
            ...state,
            ...auth,
            isAuthenticated,
            isKYCComplete: auth.user ? isKYCComplete : state.isKYCComplete,
          };
        }),
      logout: () => {
        clearStoredCredentials();
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isKYCComplete: false,
          kycSkipped: false,
          needsMFA: false,
        });
      },
    }),
    {
      name: 'velle-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({
        token: s.token,
        refreshToken: s.refreshToken,
        user: s.user,
        kycSkipped: s.kycSkipped,
      }),
    },
  ),
);
