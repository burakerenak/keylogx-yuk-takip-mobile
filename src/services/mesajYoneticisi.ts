import { mesajApi } from '../api/mesaj';
import { useAuthStore } from '../store/authStore';
import { useMesajStore } from '../store/mesajStore';
import { MesajSatiri } from '../types/mesaj.types';
import { mesajBaglantisiniBaslat, mesajBaglantisiniKapat, mesajOlayinaAbone } from './mesajBaglantisi';

/**
 * Oturum boyunca mesajlasma (4.14, #615): yetki denetimi, anlik baglanti, alt menu rozeti.
 * Yetki "Mesajlar" menusunden gelir; giristeki menu listesi eskimis olabilir (rol sonradan verildi), bu yuzden sunucuya
 * sorulur: OkunmamisToplam basariliysa yetkili.
 */
let aboneler: (() => void)[] = [];

export const okunmamisYenile = async () => {
    try {
        const n = await mesajApi.okunmamisToplam();
        useMesajStore.getState().setYetkili(true);
        useMesajStore.getState().setOkunmamis(Number(n) || 0);
        return true;
    } catch (e: any) {
        // Yetki yok (isSuccess false) → sekme gizli; ag hatasinda bilinen durum korunur.
        if (e && e.isSuccess === false)
            useMesajStore.getState().setYetkili(false);
        return false;
    }
};

export const mesajlasmayiBaslat = async () => {
    mesajlasmayiDurdur();
    const yetkili = await okunmamisYenile();
    if (!yetkili)
        return;

    mesajBaglantisiniBaslat();
    const ben = () => useAuthStore.getState().user?.id;
    aboneler = [
        mesajOlayinaAbone('mesaj', (m: MesajSatiri) => {
            const s = useMesajStore.getState();
            if (m.gonderenId !== ben() && s.acikKonusmaId !== m.konusmaId)
                s.artir();
        }),
        mesajOlayinaAbone('okundu', (v: any) => { if (v?.userId === ben()) okunmamisYenile(); }),
        mesajOlayinaAbone('geriAlindi', () => okunmamisYenile()),
        mesajOlayinaAbone('yenidenBaglandi', () => okunmamisYenile()),
        mesajOlayinaAbone('onPlana', () => okunmamisYenile()),
    ];
};

export const mesajlasmayiDurdur = () => {
    aboneler.forEach(a => a());
    aboneler = [];
    mesajBaglantisiniKapat();
    useMesajStore.getState().sifirla();
};
