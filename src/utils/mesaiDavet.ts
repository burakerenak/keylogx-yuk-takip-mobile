/**
 * Ek mesai daveti (30.10.2026, #515). Bitisi gecmemis talepte kisi sayisi kadar personel secilir; secilene davet bildirimi gider.
 * Kurallari sunucu da denetler; burasi ekrani ve bildirime tiklaninca acilacak yeri belirler.
 */

export const DAVET_BEKLIYOR = 1;
export const DAVET_KALIYOR = 2;
export const DAVET_KALAMIYOR = 3;

/** "2026-10-30" + "20:00": bitis simdiden sonra mi. Saat secilmediyse gun bazinda bakilir. */
export const davetZorunlu = (tarih: string | undefined, bitis: string | undefined, simdi: Date = new Date()): boolean => {
    if (!tarih)
        return true;
    const [y, a, g] = tarih.substring(0, 10).split('-').map(Number);
    const [s, d] = (bitis ?? '23:59').split(':').map(Number);
    return new Date(y, a - 1, g, s, d).getTime() > simdi.getTime();
};

export const davetDurumMetni = (durum: number | null | undefined): string => {
    switch (durum) {
        case DAVET_KALIYOR: return 'Kalıyor';
        case DAVET_KALAMIYOR: return 'Kalamıyor';
        case DAVET_BEKLIYOR: return 'Bekliyor';
        default: return 'Davetsiz';
    }
};

export const davetDurumTonu = (durum: number | null | undefined): 'yesil' | 'kirmizi' | 'mavi' | 'gri' => {
    switch (durum) {
        case DAVET_KALIYOR: return 'yesil';
        case DAVET_KALAMIYOR: return 'kirmizi';
        case DAVET_BEKLIYOR: return 'mavi';
        default: return 'gri';
    }
};

export type BildirimHedefi =
    | { ekran: 'EkMesaiDavet', parametre: { mesaiTalebiId?: string } }
    | { ekran: 'EkMesaiDavetYonetim', parametre: { mesaiTalebiId: string } };

/** Bildirim verisinden acilacak ekran; iptal ve mesai hatirlatmada ekran acilmaz (uygulama acilir). */
export const bildirimHedefi = (veri: Record<string, unknown> | undefined | null): BildirimHedefi | undefined => {
    const talepId = typeof veri?.talepId === 'string' && veri.talepId ? veri.talepId : undefined;

    switch (veri?.tur) {
        case 'ek_mesai_davet':
            return { ekran: 'EkMesaiDavet', parametre: { mesaiTalebiId: talepId } };
        case 'ek_mesai_red':
        case 'ek_mesai_yanit_yok':
            return talepId ? { ekran: 'EkMesaiDavetYonetim', parametre: { mesaiTalebiId: talepId } } : undefined;
        default:
            return undefined;
    }
};

/**
 * Davet yonetimi: mevcut + eklenen - cikarilan kisi sayisi kisi sayisina esit olmali.
 * Hata metni ya da uygunsa null.
 */
export const davetSayiHatasi = (secilen: number, kisi: number): string | null => {
    if (secilen === kisi)
        return null;
    return secilen < kisi ? `${kisi - secilen} kişi daha seçiniz.` : `${secilen - kisi} kişiyi çıkarınız ya da kişi sayısını artırınız.`;
};
