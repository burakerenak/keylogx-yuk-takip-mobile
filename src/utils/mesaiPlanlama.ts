/**
 * 4.6 QR Mesai Faz 2 (18.10.2026) saf yardimcilari: ana sayfa kart karari, para bicimi,
 * Yeni Talep kademeli secim listeleri, talep doluluk / eksik hesabi, tarih secenekleri.
 * React / ag bagimliligi yoktur; __tests__/mesaiPlanlama.test.ts ile sinanir.
 */
import { MesaiPoSatiri, MesaiTalebiDepo, MesaiTalebiItem } from '../types/mesai.types';

// ---------------------------------------------------------------- Ana sayfa kartlari

/** Sunucunun kart kodu -> ekranda gorunen ad. */
export const KART_ADLARI: Record<string, string> = {
    Gorevlerim: 'Görevlerim',
    MesaiPlanlama: 'Mesai Planlama',
};

export type AnaSayfaKartlari = {
    gorevlerim: boolean
    mesaiPlanlama: boolean
    /** Mesai kapaliyken Mesai kartinin altindaki ipucu ("Görevlerim ve Mesai Planlama mesainiz başlayınca açılır."); yoksa null. */
    ipucu: string | null
};

/** ["Görevlerim", "Mesai Planlama"] -> "Görevlerim ve Mesai Planlama"; uc ve fazlasi "A, B ve C". */
export const adlariBirlestir = (adlar: string[]): string => {
    if (adlar.length <= 1) return adlar[0] ?? '';

    return `${adlar.slice(0, -1).join(', ')} ve ${adlar[adlar.length - 1]}`;
};

/** Bilinen kart kodlarini sirali ve tekil olarak ayiklar (bilinmeyen kod yok sayilir). */
export const yetkiliKartlar = (kartlar: string[] | null | undefined): string[] =>
    Object.keys(KART_ADLARI).filter(k => (kartlar ?? []).includes(k));

/**
 * Ana sayfada hangi kartlarin gorunecegi (sozlesme 4.1, R11).
 *
 * - kartlar alani hic gelmezse (undefined / null: Faz 2 oncesi sunucu) 4.5 davranisi: Gorevlerim surucu kaydi olan
 *   kullanicida her zaman gorunur, Mesai Planlama gorunmez, ipucu yok.
 * - kartlar geldiyse Gorevlerim yalniz acik mesai kaydi varken gorunur; kapaliyken ipucu gosterilir.
 * - Mesai Planlama mesai acik olmasa da gorunur (22.10.2026, Burak): planlamaci evden / mesai disinda talep girebilir.
 * - Personele bagli olmayan, yalniz surucu kullanici (gorevi yok, kartlar bos gelir) eskisi gibi arac QR'i okutur;
 *   seferlerine ulasamaz hale gelmesin diye Gorevlerim ona her durumda yetkili sayilir (yine yalniz mesai acikken).
 */
export const anaSayfaKartlari = (p: {
    kartlar: string[] | null | undefined
    acikKayitVar: boolean
    surucu: boolean
    personel: boolean
}): AnaSayfaKartlari => {
    if (p.kartlar === undefined || p.kartlar === null)
        return { gorevlerim: p.surucu, mesaiPlanlama: false, ipucu: null };

    const yetkili = yetkiliKartlar(p.kartlar);

    if (p.surucu && !p.personel && !yetkili.includes('Gorevlerim'))
        yetkili.unshift('Gorevlerim');

    const planlama = yetkili.includes('MesaiPlanlama');

    if (!p.acikKayitVar) {
        // Mesai Planlama mesaiye bagli degil; ipucu yalniz mesaiyle acilan kartlari sayar.
        const bekleyen = yetkili.filter(k => k !== 'MesaiPlanlama');
        return {
            gorevlerim: false,
            mesaiPlanlama: planlama,
            ipucu: bekleyen.length ? `${adlariBirlestir(bekleyen.map(k => KART_ADLARI[k]))} mesainiz başlayınca açılır.` : null,
        };
    }

    return { gorevlerim: yetkili.includes('Gorevlerim'), mesaiPlanlama: planlama, ipucu: null };
};

// ---------------------------------------------------------------- Para

/** 1234.5 -> "1.234,50 ₺" (tr-TR, iki ondalik). Telefonun Intl destegine bagli kalmamak icin elle bicimlenir. */
export const paraMetni = (tutar: number | null | undefined): string => {
    const n = Number.isFinite(tutar as number) ? (tutar as number) : 0;
    const kurus = Math.round(Math.abs(n) * 100);
    const tam = Math.floor(kurus / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const ondalik = (kurus % 100).toString().padStart(2, '0');

    return `${n < 0 && kurus > 0 ? '-' : ''}${tam},${ondalik} ₺`;
};

// ---------------------------------------------------------------- Mesai Gecmisim (alacak, donem)

/**
 * Ay kartinda Alacak satiri gosterilsin mi: alan gelmisse (Faz 2 sunucusu) personelde her zaman (0 dahil),
 * personel kaydi olmayan (yalniz surucu) kullanicida yalniz tutar varsa.
 */
export const alacakGosterilir = (alacak: number | null | undefined, personel: boolean): boolean =>
    typeof alacak === 'number' && Number.isFinite(alacak) && (personel || alacak > 0);

/** Donem rozeti: "Açık" -> "Açık dönem" (mavi), "Kapandı" -> gri; alan yoksa rozet yok. */
export const donemRozeti = (durum: string | null | undefined): { metin: string, ton: 'mavi' | 'gri' } | null => {
    const d = (durum ?? '').trim();

    if (!d) return null;
    if (d.toLowerCase() === 'açık') return { metin: 'Açık dönem', ton: 'mavi' };
    return { metin: d, ton: 'gri' };
};

// ---------------------------------------------------------------- Kademeli secim (Musteri -> Bolum -> PO · PO No)

export type SecimOgesi = { deger: string, ad: string };

/** Bolum adi bos gelen PO satirlari icin gorunen ad. */
export const BOLUMSUZ = '(Bölüm yok)';

const bolumAnahtari = (x: MesaiPoSatiri) => x.divisionName ?? '';

/** PO satirlarindaki musteriler (tekil, ilk gorulme sirasiyla). */
export const musteriListesi = (satirlar: MesaiPoSatiri[]): SecimOgesi[] => {
    const goruldu = new Set<string>();
    const sonuc: SecimOgesi[] = [];

    for (const x of satirlar ?? []) {
        if (goruldu.has(x.customerId)) continue;
        goruldu.add(x.customerId);
        sonuc.push({ deger: x.customerId, ad: x.customerName });
    }

    return sonuc;
};

/** Secili musterinin bolumleri (tekil). deger = bolum adi (bos bolum ''). */
export const bolumListesi = (satirlar: MesaiPoSatiri[], customerId: string | undefined): SecimOgesi[] => {
    if (!customerId) return [];

    const goruldu = new Set<string>();
    const sonuc: SecimOgesi[] = [];

    for (const x of satirlar ?? []) {
        if (x.customerId !== customerId) continue;

        const b = bolumAnahtari(x);
        if (goruldu.has(b)) continue;
        goruldu.add(b);
        sonuc.push({ deger: b, ad: b || BOLUMSUZ });
    }

    return sonuc;
};

/** "PO · PO No" gorunen adi (bos parcalar atlanir; ikisi de bossa sunucu etiketi). */
export const poAdi = (x: MesaiPoSatiri): string =>
    [x.poName, x.poNo].filter(v => v !== null && v !== undefined && `${v}`.trim() !== '').join(' · ') || x.etiket;

/** Secili musteri + bolumun PO satirlari. deger = companyPoId. */
export const poListesi = (satirlar: MesaiPoSatiri[], customerId: string | undefined, bolum: string | undefined): SecimOgesi[] => {
    if (!customerId || bolum === undefined) return [];

    return (satirlar ?? [])
        .filter(x => x.customerId === customerId && bolumAnahtari(x) === bolum)
        .map(x => ({ deger: x.companyPoId, ad: poAdi(x) }));
};

/**
 * Depo eslesmesi (#508; sunucudaki MesaiDepoEslesme ile ayni): depoya musteri secilmisse yalniz o musterilerin PO satirlari;
 * musteriye bolum secilmisse yalniz o bolumler, secilmemisse butun bolumleri. Eslesme yoksa butun satirlar.
 */
export const depoSatirlari = (satirlar: MesaiPoSatiri[], depo: MesaiTalebiDepo | undefined): MesaiPoSatiri[] => {
    const eslesme = depo?.musteriler ?? [];
    if (eslesme.length === 0) return satirlar ?? [];

    return (satirlar ?? []).filter(x => {
        const m = eslesme.find(e => e.musteriId === x.customerId);
        return m !== undefined && (m.bolumIdleri.length === 0 || (!!x.divisionId && m.bolumIdleri.includes(x.divisionId)));
    });
};

/** Yeni talepte varsayilan depo: sunucunun verdigi (tek depoda yetkili), yoksa listede tek depo varsa o. */
export const varsayilanDepo = (depolar: MesaiTalebiDepo[], sunucuVarsayilani: string | null | undefined, onceki?: string): string | undefined => {
    if (onceki !== undefined && depolar.some(x => x.mesaiNoktasiId === onceki)) return onceki;
    if (sunucuVarsayilani && depolar.some(x => x.mesaiNoktasiId === sunucuVarsayilani)) return sunucuVarsayilani;
    return depolar.length === 1 ? depolar[0].mesaiNoktasiId : undefined;
};

/** Listede tek secenek varsa onu, yoksa (ya da onceki secim listede kalmadiysa) undefined doner: kademede otomatik secim. */
export const kendiliginden = (liste: SecimOgesi[], onceki: string | undefined): string | undefined => {
    if (onceki !== undefined && liste.some(x => x.deger === onceki)) return onceki;

    return liste.length === 1 ? liste[0].deger : undefined;
};

// ---------------------------------------------------------------- Saat araligi

/** "18:00-22:00" ya da "18:00–22:00" -> { baslangic: "18:00", bitis: "22:00" }; gecersizse null. */
export const aralikCoz = (metin: string | null | undefined): { baslangic: string, bitis: string } | null => {
    const m = (metin ?? '').match(/^\s*(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})\s*$/);
    if (!m) return null;

    const iki = (s: string) => s.padStart(2, '0');

    return { baslangic: `${iki(m[1])}:${m[2]}`, bitis: `${iki(m[3])}:${m[4]}` };
};

/** "18:00-22:00" -> "18:00 – 22:00" (ekranda). */
export const aralikMetni = (metin: string): string => {
    const a = aralikCoz(metin);

    return a ? `${a.baslangic} – ${a.bitis}` : metin;
};

// ---------------------------------------------------------------- Talep doluluk / eksik

export type DolulukKutusu = 'dolu' | 'ayrilan' | 'bos';

/** Yerlesen kisi sayisi (sunucu yerlesenSayisi gondermezse liste uzunlugu). */
export const yerlesenSayisi = (t: Pick<MesaiTalebiItem, 'yerlesenSayisi' | 'yerlesenler'>): number =>
    Number.isFinite(t.yerlesenSayisi) ? t.yerlesenSayisi : (t.yerlesenler ?? []).length;

/** Eksik kisi (sunucu eksik gondermezse kisi sayisi - yerlesen); en az 0. */
export const eksikSayisi = (t: Pick<MesaiTalebiItem, 'eksik' | 'kisiSayisi' | 'yerlesenSayisi' | 'yerlesenler'>): number =>
    Math.max(0, Number.isFinite(t.eksik) ? t.eksik : t.kisiSayisi - yerlesenSayisi(t));

/**
 * Doluluk kutulari (simulasyondaki gibi): once yerlesenler (dolu), sonra henuz gelmemis isimle ayrilanlar (ayrilan),
 * kalan bos. Kutu sayisi = kisi sayisi (yerlesen fazlaysa yerlesen kadar).
 */
export const dolulukKutulari = (t: Pick<MesaiTalebiItem, 'kisiSayisi' | 'yerlesenSayisi' | 'yerlesenler' | 'ayrilanlar'>): DolulukKutusu[] => {
    const dolu = yerlesenSayisi(t);
    const ayrilan = (t.ayrilanlar ?? []).filter(x => !x.geldi).length;
    const toplam = Math.max(t.kisiSayisi ?? 0, dolu);

    return Array.from({ length: toplam }, (_, i) => (i < dolu ? 'dolu' : i < dolu + ayrilan ? 'ayrilan' : 'bos'));
};

/** Ana sayfa Mesai Planlama karti: bugunku talep sayisi + toplam eksik kisi. */
export const gunOzeti = (talepler: MesaiTalebiItem[]): { talep: number, eksik: number } => ({
    talep: (talepler ?? []).length,
    eksik: (talepler ?? []).reduce((s, t) => s + eksikSayisi(t), 0),
});

/** "Bugün 3 talep · 2 kişi eksik" / "Bugün talep yok". */
export const gunOzetiMetni = (o: { talep: number, eksik: number } | undefined): string => {
    if (!o) return 'Ek mesai taleplerini görün';
    if (o.talep === 0) return 'Bugün talep yok';

    return `Bugün ${o.talep} talep · ${o.eksik > 0 ? `${o.eksik} kişi eksik` : 'eksik yok'}`;
};

// ---------------------------------------------------------------- Tarih

const iki = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Yerel tarih -> "yyyy-MM-dd". */
export const isoTarih = (d: Date): string => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;

/** "yyyy-MM-dd" -> "dd.MM.yyyy". */
export const trTarih = (iso: string): string => {
    const [y, m, d] = (iso ?? '').split('-');

    return y && m && d ? `${d}.${m}.${y}` : iso;
};

const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/** Yeni Talep tarih secenekleri: bugun ve sonraki gunler ("18.10.2026 · Bugün", "19.10.2026 · Yarın", "20.10.2026 · Salı"). */
export const tarihSecenekleri = (bugun: Date, gunSayisi = 31): SecimOgesi[] =>
    Array.from({ length: gunSayisi }, (_, i) => {
        const d = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + i);
        const iso = isoTarih(d);
        const ek = i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : GUNLER[d.getDay()];

        return { deger: iso, ad: `${trTarih(iso)} · ${ek}` };
    });

/** Iso tarihe gun ekler (eksi olabilir). */
export const gunEkle = (bugun: Date, gun: number): string =>
    isoTarih(new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + gun));

// ---------------------------------------------------------------- Is tipi

/** Ana sayfa / QR sonucunda buyuk harfli is tipi: "Lojistik" -> "LOJİSTİK" (Turkce buyuk harf). */
export const isTipiBuyuk = (ad: string | null | undefined): string => (ad ? ad.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase() : '');

/** Simulasyon renkleri: Lojistik mavi, Ambalaj turuncu; digerleri gri. */
export const isTipiRengi = (ad: string | null | undefined): string => {
    const k = (ad ?? '').toLocaleLowerCase('tr-TR');

    if (k.startsWith('lojistik')) return '#1B84FF';
    if (k.startsWith('ambalaj')) return '#EA580C';
    return '#5B6577';
};
