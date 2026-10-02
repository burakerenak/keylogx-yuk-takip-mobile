import { create } from 'zustand';

type LoadingStore = {
    loadingCount: number;
    show: () => void;
    hide: () => void;
};

export const useLoadingStore = create<LoadingStore>((set) => ({
    loadingCount: 0,

    show: () =>
        set((state) => ({
            loadingCount: state.loadingCount + 1,
        })),

    hide: () =>
        set((state) => ({
            loadingCount: Math.max(0, state.loadingCount - 1),
        })),
}));