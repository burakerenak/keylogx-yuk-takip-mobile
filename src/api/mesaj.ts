import { api } from './client';
import { ApiResponse } from '../types/api.types';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';
import { KonusmaOzeti, MesajKisi, MesajSatiri } from '../types/mesaj.types';

/**
 * Firma ici mesajlasma (4.14, 17.11.2026, Burak, #615). Sunucu MesajController (web ile ayni uclar).
 * Yalniz "Mesajlar" yetkili kullanicilar; istekler arka planda (yukleniyor perdesi acilmaz).
 */

const cagir = async <T>(yol: string, govde: any, sessiz = true): Promise<T> => {
    const res = await api.post<ApiResponse<T>>('/Mesaj/' + yol, govde, { sessiz, arkaPlan: true });
    return res.data.data;
};

export const mesajApi = {
    /** Yetki yoksa hata doner (sessiz): sekme gizlenir. */
    okunmamisToplam: () => cagir<number>('OkunmamisToplam', {}),
    konusmalar: () => cagir<KonusmaOzeti[]>('Konusmalar', {}),
    kisiler: () => cagir<MesajKisi[]>('Kisiler', {}),
    gecmis: (konusmaId: string, oncekiMesajId?: string) => cagir<MesajSatiri[]>('Gecmis', { konusmaId, oncekiMesajId }),
    gonder: (konusmaId: string, metin: string) => cagir<MesajSatiri>('Gonder', { konusmaId, metin }, false),
    okundu: (konusmaId: string) => cagir<unknown>('Okundu', { konusmaId }),
    geriAl: (mesajId: string) => cagir<unknown>('GeriAl', { mesajId }, false),
    birebirBaslat: (userId: string) => cagir<KonusmaOzeti>('BirebirBaslat', { userId }, false),
};

export interface Fotograf {
    uri: string
    ad: string
    tur: string
}

/**
 * Fotografli mesaj (multipart; web DosyaGonder ile ayni uc). Axios RN'de FormData'yi dogru gonderir;
 * Content-Type sinirini (boundary) RN kendisi koyar.
 */
export const fotografGonder = async (konusmaId: string, metin: string, f: Fotograf): Promise<MesajSatiri> => {
    const veri = new FormData();
    veri.append('konusmaId', konusmaId);
    veri.append('metin', metin);
    veri.append('dosya', { uri: f.uri, name: f.ad, type: f.tur } as any);
    const res = await api.post<ApiResponse<MesajSatiri>>('/Mesaj/DosyaGonder', veri, {
        arkaPlan: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (d) => d,
    });
    return res.data.data;
};

/** Sunucunun verdigi dosya adresi goreli gelirse API adresiyle tamamlanir. */
export const dosyaAdresi = (url: string | null | undefined) => {
    if (!url) return undefined;
    return /^https?:\/\//i.test(url) ? url : API_URL.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
};

export const oturumAnahtari = () => useAuthStore.getState().user?.token ?? '';
