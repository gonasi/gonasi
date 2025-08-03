import { create } from 'zustand';

import type {
  UserActiveSessionLoaderReturnType,
  UserProfileLoaderReturnType,
  UserRoleLoaderReturnType,
} from '~/root';

type Mode = 'preview' | 'play';

/**
 * Global application store
 * Handles user session, preferences, modals, and UI state
 */
interface StoreState {
  // ===== User State =====
  activeSession: UserActiveSessionLoaderReturnType;
  activeUserProfile: UserProfileLoaderReturnType;
  activeUserRole: UserRoleLoaderReturnType;
  isActiveUserProfileLoading: boolean;

  updateActiveSession: (newSession: UserActiveSessionLoaderReturnType) => void;
  updateActiveUserProfile: (userProfile: UserProfileLoaderReturnType) => void;
  updateActiveUserRole: (userRole: UserRoleLoaderReturnType) => void;

  // ===== Explanation Modal State =====
  isExplanationBottomSheetOpen: boolean;
  storeExplanationState: string | null;

  setExplanationState: (explanationState: string | null) => void;
  closeExplanation: () => void;

  // ===== User Preferences =====
  isSoundEnabled: boolean;
  isVibrationEnabled: boolean;

  toggleSound: () => void;
  setSound: (soundEnabled: boolean) => void;

  toggleVibration: () => void;
  setVibration: (vibrationEnabled: boolean) => void;

  // ===== UI Mode State =====
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const useStore = create<StoreState>((set) => ({
  // ----- Initial User State -----
  activeSession: null,
  activeUserProfile: null,
  activeUserRole: 'user',
  isActiveUserProfileLoading: true,

  updateActiveSession: (newSession) => set({ activeSession: newSession }),
  updateActiveUserProfile: (userProfile) =>
    set({ activeUserProfile: userProfile, isActiveUserProfileLoading: false }),
  updateActiveUserRole: (userRole) => set({ activeUserRole: userRole }),

  // ----- Explanation Modal -----
  isExplanationBottomSheetOpen: false,
  storeExplanationState: null,

  setExplanationState: (explanationState) =>
    set({
      storeExplanationState: explanationState,
      isExplanationBottomSheetOpen: explanationState !== null,
    }),

  closeExplanation: () =>
    set({
      storeExplanationState: null,
      isExplanationBottomSheetOpen: false,
    }),

  // ----- Preferences -----
  isSoundEnabled: true,
  isVibrationEnabled: true,

  toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),
  setSound: (soundEnabled) => set({ isSoundEnabled: soundEnabled }),

  toggleVibration: () => set((state) => ({ isVibrationEnabled: !state.isVibrationEnabled })),
  setVibration: (vibrationEnabled) => set({ isVibrationEnabled: vibrationEnabled }),

  // ----- Mode State -----
  mode: 'play',
  setMode: (mode) => set({ mode }),
}));
