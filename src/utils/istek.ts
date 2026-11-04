/**
 * IK Faz 3 (03.11.2026) saf yardimcilari: istek durumu adi / tonu, gun sayisi, tarih secenekleri, bakiye metni.
 * React / ag bagimliligi yoktur; __tests__/istek.test.ts ile sinanir.
 */
import { IstekDurumu, IzinBakiyeItem } from '../types/istek.types';
import { isoTarih, trTarih } from './mesaiPlanlama';

export const ONAYLI: IstekDurumu = 1;
export const BEKLIYOR: IstekDurumu = 2;
export const REDDEDILDI: IstekDurumu = 3;
export const IPTAL: IstekDurumu = 4;
export const TATIL_KODU = 'HT';

export const istekDurumAdi = (durum: number | null | undefined): string => {
    switch (durum) {
        case ONAYLI: return 'Onaylı';
        case BEKLIYOR: return 'Onay bekliyor';
        case REDDEDILDI: return 'Reddedildi';
        case IPTAL: return 'İptal edildi';
        default: return '';
    }
};

export const istekDurumTonu = (durum: number | null | undefined): 'yesil' | 'amber' | 'kirmizi' | 'gri' => {
    switch (durum) {
        case ONAYLI: return 'yesil';
        case BEKLIYOR: return 'amber';
        case REDDEDILDI: return 'kirmizi';
        default: return 'gri';
    }
};

/** Iki tarih dahil gun sayisi ("yyyy-MM-dd"); bitis baslangictan onceyse 0. */
export const gunSayisi = (bas: string | undefined, bit: string | undefined): number => {
    if (!bas || !bit) return 0;
    const [y1, m1, d1] = bas.split('-').map(Number);
    const [y2, m2, d2] = bit.split('-').map(Number);
    const fark = Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);

    return fark < 0 ? 0 : fark + 1;
};

const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/** Tarih secenekleri: bugunden geri (geriGun) ve ileri (ileriGun) — izin formu ("18.11.2026 Sal"). */
export const izinTarihSecenekleri = (bugun: Date, geriGun: number, ileriGun: number): { deger: string, ad: string }[] =>
    Array.from({ length: geriGun + ileriGun + 1 }, (_, i) => {
        const d = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - geriGun + i);
        const iso = isoTarih(d);
        const ek = i === geriGun ? 'Bugün' : GUN_KISA[d.getDay()];

        return { deger: iso, ad: `${trTarih(iso)} · ${ek}` };
    });

/** Bakiye kutusunun alt satiri: "Hak 28 · Kullanılan 4 · Bekleyen 2". */
export const bakiyeOzeti = (b: IzinBakiyeItem | null | undefined): string => {
    if (!b) return '';
    const parca = [`Hak edilen ${b.hakEdilen}`, `Kullanılan ${b.kullanilan}`];
    if (b.devreden) parca.unshift(`Devreden ${sayi(b.devreden)}`);
    if (b.bekleyen) parca.push(`Onay bekleyen ${b.bekleyen}`);

    return parca.join(' · ');
};

/** 12.5 -> "12,5"; 12 -> "12". */
export const sayi = (n: number | null | undefined): string => {
    const v = Number.isFinite(n as number) ? (n as number) : 0;

    return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
};

/** Sayi rozeti metni: 0 ya da gecersizse null (rozet yok), 99 ustu "99+". */
export const rozetMetni = (n: number | null | undefined): string | null => {
    const v = Number.isFinite(n as number) ? Math.floor(n as number) : 0;
    if (v <= 0) return null;

    return v > 99 ? '99+' : String(v);
};

/** Vardiya hucresi metni: izin varsa izin kodu, yoksa vardiya kodu, plan yoksa "—". */
export const gunKodu = (g: { kod: string | null, izinKodu: string | null }): string => g.izinKodu ?? g.kod ?? '—';
