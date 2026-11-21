import { MesaiGecmisGun, MesaiKaydiOzet } from '../types/mesai.types';

/**
 * Eksik Mesai (21.11.2026): mesai kapamasi (cikis okutmasi) yapilmadigi icin "Eksik çıkış" durumuna dusen kayit (durum 3).
 * Sunucu kayit eksik olunca bir kez sesli bildirim gonderir (veri tur = "eksik_mesai", tarih = "yyyy-MM-dd"); dokununca
 * Mesai Gecmisim'in o ayi yalniz eksik kayitlarla acilir. Eksik kayit gun / ay toplamlarina katilmaz (sunucu hesaplar).
 */
export const EKSIK_MESAI_DURUMU = 3;
export const EKSIK_MESAI_METNI = 'Mesai kapaması yapılmadığı için mesai ücreti alamayacaksınız.';

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export const eksikMesaiMi = (k: Pick<MesaiKaydiOzet, 'durum'>): boolean => k.durum === EKSIK_MESAI_DURUMU;

/** Kayitta gosterilecek yazili uyari: sunucunun metni, eski sunucuda eksik kayitta sabit metin; eksik degilse null. */
export const eksikUyarisi = (k: Pick<MesaiKaydiOzet, 'durum' | 'uyari'>): string | null =>
    k.uyari ? k.uyari : eksikMesaiMi(k) ? EKSIK_MESAI_METNI : null;

/** Gunlerdeki eksik kayit sayisi. */
export const eksikSayisi = (gunler: MesaiGecmisGun[]): number =>
    gunler.reduce((t, g) => t + (g.kayitlar ?? []).filter(eksikMesaiMi).length, 0);

/** Yalniz eksik suzgeci: gunlerde yalniz eksik kayitlar kalir, eksigi olmayan gun cikar. Suzgec kapaliysa liste aynen doner. */
export const gunleriSuz = (gunler: MesaiGecmisGun[], yalnizEksik: boolean): MesaiGecmisGun[] =>
    !yalnizEksik
        ? gunler
        : gunler
            .map(g => ({ ...g, kayitlar: (g.kayitlar ?? []).filter(eksikMesaiMi) }))
            .filter(g => g.kayitlar.length > 0);

/** Bildirim verisinden Mesai Gecmisim ay detayi (yalniz eksik); tarih okunamazsa undefined (ekran acilmaz). */
export const eksikMesaiHedefi = (veri: Record<string, unknown> | undefined | null) => {
    const tarih = typeof veri?.tarih === 'string' ? veri.tarih.match(/^(\d{4})-(\d{2})-\d{2}/) : null;
    if (!tarih) return undefined;

    const yil = parseInt(tarih[1], 10);
    const ay = parseInt(tarih[2], 10);
    if (ay < 1 || ay > 12) return undefined;

    return { ekran: 'MesaiGecmisiGun' as const, parametre: { yil, ay, donemAdi: `${AYLAR[ay - 1]} ${yil}`, yalnizEksik: true } };
};
