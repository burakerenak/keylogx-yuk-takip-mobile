/**
 * 4.4 QR mesai metin yardimcilari.
 */

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
