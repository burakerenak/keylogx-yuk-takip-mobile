import { create } from 'zustand';

/**
 * Ana sayfanin hesapladigi Gorevlerim karti karari (21.10.2026): alt menudeki Gorevlerim sekmesi de ayni kurala uyar
 * (gorev yetkisi = Arac + surucu kaydi + mesai acik; personeli olmayan yalniz surucu kullanicida her zaman).
 * null: ana sayfa Mesai/Durum'u henuz okumadi -> eski davranis (surucu kaydi varsa sekme gorunur).
 */
type MesaiKartStore = {
    gorevlerim: boolean | null;
    setGorevlerim: (v: boolean | null) => void;
};

export const useMesaiKartStore = create<MesaiKartStore>((set) => ({
    gorevlerim: null,
    setGorevlerim: (v) => set({ gorevlerim: v }),
}));
