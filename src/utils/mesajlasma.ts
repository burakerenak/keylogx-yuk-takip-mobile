/**
 * Firma ici mesajlasma yardimcilari (4.14, 17.11.2026, #615). Saf islevler; web helpers/mesajlasma ve sunucudaki
 * Mesajlasma.cs ile ayni kurallar (geri alma 5 dk, metin 4000 karakter).
 */
import { BIREBIR, KonusmaOzeti, MesajSatiri } from '../types/mesaj.types';

export const GERI_ALMA_MS = 5 * 60 * 1000;
export const EN_UZUN_METIN = 4000;
/** Telefonda kucultme: uzun kenar en fazla 1600 piksel, JPEG kalite 0,8 (mobil veri az harcansin). */
export const FOTO_EN_BUYUK_KENAR = 1600;
export const FOTO_KALITE = 0.8;
export const EN_BUYUK_DOSYA = 10 * 1024 * 1024;

const iki = (n: number) => String(n).padStart(2, '0');
const gunAnahtari = (d: Date) => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** Mesaj saati "14:05". */
export const saat = (iso: string) => { const d = new Date(iso); return `${iki(d.getHours())}:${iki(d.getMinutes())}`; };

/** Liste zamani: bugunse saat, dunse "Dün", bu yilsa "11.11", degilse "11.11.2025". */
export const listeZamani = (iso: string | null | undefined, simdi: Date = new Date()) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (gunAnahtari(d) === gunAnahtari(simdi)) return saat(iso);
    const dun = new Date(simdi); dun.setDate(dun.getDate() - 1);
    if (gunAnahtari(d) === gunAnahtari(dun)) return 'Dün';
    return d.getFullYear() === simdi.getFullYear() ? `${iki(d.getDate())}.${iki(d.getMonth() + 1)}` : `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/** Gun ayraci: "Bugün", "Dün", "11 Kasım 2026" (Intl'e bagli kalmadan). */
export const gunAyraci = (iso: string, simdi: Date = new Date()) => {
    const d = new Date(iso);
    if (gunAnahtari(d) === gunAnahtari(simdi)) return 'Bugün';
    const dun = new Date(simdi); dun.setDate(dun.getDate() - 1);
    if (gunAnahtari(d) === gunAnahtari(dun)) return 'Dün';
    return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
};

export const ayracGerekli = (onceki: MesajSatiri | undefined, m: MesajSatiri) =>
    !onceki || gunAnahtari(new Date(onceki.zaman)) !== gunAnahtari(new Date(m.zaman));

export const geriAlinabilir = (m: MesajSatiri, benimId: string | undefined, simdi: number = Date.now()) =>
    !!benimId && m.gonderenId === benimId && !m.geriAlindi && simdi - new Date(m.zaman).getTime() <= GERI_ALMA_MS;

export const gonderilebilir = (metin: string) => metin.trim().length > 0 && metin.trim().length <= EN_UZUN_METIN;

/** Mesaji listeye ekler (ayni Id varsa gunceller), zamana gore sirali (eski → yeni). */
export const mesajEkle = (liste: MesajSatiri[], m: MesajSatiri): MesajSatiri[] => {
    const i = liste.findIndex(x => x.id === m.id);
    const yeni = i >= 0 ? liste.map(x => x.id === m.id ? { ...x, ...m } : x) : [...liste, m];
    return yeni.sort((a, b) => a.zaman.localeCompare(b.zaman));
};

/** Liste ozeti: geri alinmissa "Bu mesaj geri alındı"; fotografli mesajda metin yoksa "📷 Fotoğraf". */
export const mesajOzeti = (m: MesajSatiri) => {
    if (m.geriAlindi) return 'Bu mesaj geri alındı';
    const metin = (m.metin ?? '').replace(/\s+/g, ' ').trim();
    if (m.dosyaAdi) return metin ? `${m.dosyaResim ? '📷' : '📎'} ${metin}` : (m.dosyaResim ? '📷 Fotoğraf' : `📎 ${m.dosyaAdi}`);
    return metin;
};

/**
 * Yeni mesajda konusma listesi: son mesaj guncellenir, basa alinir; baskasindan gelmis ve o konusma acik degilse okunmamis +1.
 * Konusma listede yoksa liste aynen doner (cagiran yeniden yukler).
 */
export const konusmayiGuncelle = (liste: KonusmaOzeti[], m: MesajSatiri, benimId: string | undefined, acikKonusmaId: string | undefined): KonusmaOzeti[] => {
    const k = liste.find(x => x.id === m.konusmaId);
    if (!k) return liste;
    const benden = m.gonderenId === benimId;
    const guncel: KonusmaOzeti = {
        ...k,
        sonMesaj: mesajOzeti(m).slice(0, 80),
        sonGonderen: benden ? 'Siz' : m.gonderenAdi,
        sonMesajZamani: m.zaman,
        okunmamis: !benden && acikKonusmaId !== m.konusmaId ? k.okunmamis + 1 : (acikKonusmaId === m.konusmaId ? 0 : k.okunmamis),
    };
    return [guncel, ...liste.filter(x => x.id !== m.konusmaId)];
};

export const toplamOkunmamis = (liste: KonusmaOzeti[]) => liste.reduce((t, k) => t + (k.okunmamis || 0), 0);

export type SohbetFiltresi = 'tumu' | 'okunmamis' | 'gruplar';

/** Sabitlenenler en ustte, sonra son mesaja gore (yeni once). */
export const konusmaSirala = (liste: KonusmaOzeti[]) => [...liste].sort((a, b) => {
    const sa = a.sabitlemeZamani ?? '', sb = b.sabitlemeZamani ?? '';
    if (!!sa !== !!sb) return sa ? -1 : 1;
    if (sa !== sb) return sb.localeCompare(sa);
    return (b.sonMesajZamani ?? '').localeCompare(a.sonMesajZamani ?? '');
});

const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR');

/** Filtre + arama (ad ya da son mesaj, Turkce harf duyarsiz). */
export const konusmaSuz = (liste: KonusmaOzeti[], filtre: SohbetFiltresi, arama: string) => {
    const a = kucuk(arama.trim());
    return konusmaSirala(liste)
        .filter(k => filtre === 'okunmamis' ? k.okunmamis > 0 : filtre === 'gruplar' ? k.tur !== BIREBIR : true)
        .filter(k => !a || kucuk(k.ad).includes(a) || kucuk(k.sonMesaj ?? '').includes(a));
};

/** Yeni sohbet listesi: ada gore arama, alfabetik. */
export const kisiSuz = <T extends { ad: string }>(kisiler: T[], arama: string) => {
    const a = kucuk(arama.trim());
    return kisiler.filter(k => !a || kucuk(k.ad).includes(a)).sort((x, y) => x.ad.localeCompare(y.ad, 'tr'));
};

/** Bildirim sayisi gosterimi: 99'dan fazlasi "99+". */
export const rozet = (n: number) => n <= 0 ? '' : n > 99 ? '99+' : String(n);

/** Fotograf dosya adi: "foto-20261117-1530.jpg". */
export const fotografAdi = (simdi: Date = new Date()) =>
    `foto-${simdi.getFullYear()}${iki(simdi.getMonth() + 1)}${iki(simdi.getDate())}-${iki(simdi.getHours())}${iki(simdi.getMinutes())}${iki(simdi.getSeconds())}.jpg`;

/** Ad bas harfleri (yuvarlak rozet): "Ali Veli" → "AV". */
export const basHarfler = (ad: string) => ad.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0).toLocaleUpperCase('tr-TR')).join('');
