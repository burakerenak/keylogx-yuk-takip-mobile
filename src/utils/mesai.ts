/**
 * 4.4 QR mesai metin yardimcilari.
 */

/**
 * Sunucunun "yyyy-MM-ddTHH:mm:ss" (ya da "yyyy-MM-dd") metnini yerel saat olarak cozer (saat dilimi eki yok).
 * Sunucu zamanlarinin hepsi ayni bicimde cozuldugu icin aralarindaki fark dogru cikar. Gecersizse null.
 */
export const sunucuZamaniCoz = (metin: string | null | undefined): number | null => {
    if (!metin) return null;

    const p = metin.match(/\d+/g)?.map(x => parseInt(x, 10)) ?? [];
    if (p.length < 3) return null;

    const [y, m, d, h = 0, mi = 0, s = 0] = p;
    const t = new Date(y, m - 1, d, h, mi, s).getTime();

    return Number.isFinite(t) ? t : null;
};

const iki = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Milisaniyeyi canli sayac bicimine cevirir: "02:15:37" (saat 99'u gecerse basamak artar). */
export const sayacMetni = (ms: number): string => {
    const toplam = Math.max(0, Math.floor(ms / 1000));

    return `${iki(Math.floor(toplam / 3600))}:${iki(Math.floor((toplam % 3600) / 60))}:${iki(toplam % 60)}`;
};

/** "ekim 2026" -> "Ekim 2026". */
export const basHarfBuyuk = (metin: string | null | undefined): string =>
    metin ? metin.charAt(0).toLocaleUpperCase('tr-TR') + metin.slice(1) : '';

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** "2026-10-12" + "pazartesi" -> "12 Ekim, Pazartesi". */
export const gunBasligi = (tarih: string, gunAdi?: string | null): string => {
    const [, m, d] = (tarih ?? '').split('-').map(x => parseInt(x, 10));
    const tarihMetni = Number.isFinite(d) && m >= 1 && m <= 12 ? `${d} ${AYLAR[m - 1]}` : tarih;

    return gunAdi ? `${tarihMetni}, ${basHarfBuyuk(gunAdi)}` : tarihMetni;
};

/** Dakikayi "8 sa 30 dk" bicimine cevirir (0 -> "0 dk"). */
export const sureMetni = (dk: number | null | undefined): string => {
    const toplam = Math.max(0, Math.round(dk ?? 0));
    const sa = Math.floor(toplam / 60);
    const kalan = toplam % 60;

    if (sa && kalan) return `${sa} sa ${kalan} dk`;
    if (sa) return `${sa} sa`;
    return `${kalan} dk`;
};

/** Sayinin okunusundaki son kelimeye gore ayrilma eki: 1 bir-den, 3 uc-ten, 6 alti-dan, 40 kirk-tan... */
const ayrilmaEki = (n: number): string => {
    const birler = ['dan', 'den', 'den', 'ten', 'ten', 'ten', 'dan', 'den', 'den', 'dan']; // sifir, bir ... dokuz
    const onlar = ['dan', 'dan', 'den', 'dan', 'tan', 'den']; // -, on, yirmi, otuz, kirk, elli

    if (n % 10 !== 0) return birler[n % 10];
    if (n === 0) return 'dan';
    return onlar[Math.floor(n / 10)] ?? 'den';
};

/** "07:56" -> "07:56'dan", "08:00" -> "08:00'den", "13:40" -> "13:40'tan". */
export const saattenBeri = (saat: string | null | undefined): string => {
    if (!saat) return '';

    const [sa, dk] = saat.split(':').map(x => parseInt(x, 10));
    const ek = Number.isFinite(dk) && dk > 0 ? ayrilmaEki(dk) : ayrilmaEki(Number.isFinite(sa) ? sa % 24 : 0);

    return `${saat}'${ek}`;
};

/** 4.6 bulunma eki: "18:30" -> "18:30'da", "08:00" -> "08:00'de", "13:40" -> "13:40'ta" (ayrilma ekinin "n"siz hali). */
export const saatte = (saat: string | null | undefined): string => {
    const beri = saattenBeri(saat);

    return beri ? beri.slice(0, -1) : '';
};
