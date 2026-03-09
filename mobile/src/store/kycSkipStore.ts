import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface KycSkipState {
  skippedUserIds: string[];
  skipKyc: (userId: string) => void;
  hasSkipped: (userId: string) => boolean;
}

export const useKycSkipStore = create<KycSkipState>()(
  persist(
    (set, get) => ({
      skippedUserIds: [],
      skipKyc: userId =>
        set(state =>
          state.skippedUserIds.includes(userId)
            ? state
            : {skippedUserIds: [...state.skippedUserIds, userId]},
        ),
      hasSkipped: userId => get().skippedUserIds.includes(userId),
    }),
    {
      name: 'velle-kyc-skip',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
