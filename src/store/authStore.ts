import { create } from 'zustand';
import { LoginResponse } from '../types/user.types';

type AuthState = {
    hydrated: boolean;
    user: LoginResponse | null;
    signIn: (user: LoginResponse) => void;
    signOut: () => void;
    setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    hydrated: false,
    user: null,
    signIn: (user) => set({ user }),
    signOut: () => set({ user: null }),
    setHydrated: (v) => set({ hydrated: v }),
}));