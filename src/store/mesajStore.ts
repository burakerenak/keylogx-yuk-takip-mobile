import { create } from 'zustand';

/**
 * Mesajlasma durumu (4.14, #615): yetki (sunucu OkunmamisToplam basarili donerse var), alt menu rozeti icin okunmamis
 * toplam, acik sohbet (o sohbetten gelen mesaj okunmamisa eklenmez).
 */
type MesajState = {
    /** null: henuz bilinmiyor. */
    yetkili: boolean | null
    okunmamis: number
    acikKonusmaId: string | undefined
    setYetkili: (v: boolean | null) => void
    setOkunmamis: (n: number) => void
    artir: () => void
    setAcikKonusma: (id: string | undefined) => void
    sifirla: () => void
};

export const useMesajStore = create<MesajState>((set) => ({
    yetkili: null,
    okunmamis: 0,
    acikKonusmaId: undefined,
    setYetkili: (v) => set({ yetkili: v }),
    setOkunmamis: (n) => set({ okunmamis: Math.max(0, n) }),
    artir: () => set((s) => ({ okunmamis: s.okunmamis + 1 })),
    setAcikKonusma: (id) => set({ acikKonusmaId: id }),
    sifirla: () => set({ yetkili: null, okunmamis: 0, acikKonusmaId: undefined }),
}));
