import {
    adlariBirlestir,
    alacakGosterilir,
    anaSayfaKartlari,
    aralikCoz,
    aralikMetni,
    bolumListesi,
    BOLUMSUZ,
    dolulukKutulari,
    donemRozeti,
    eksikSayisi,
    gunEkle,
    gunOzeti,
    gunOzetiMetni,
    isTipiBuyuk,
    kendiliginden,
    musteriListesi,
    paraMetni,
    poListesi,
    tarihSecenekleri,
    trTarih,
} from '../src/utils/mesaiPlanlama';
import { saatte } from '../src/utils/mesai';
import { MesaiPoSatiri, MesaiTalebiItem } from '../src/types/mesai.types';

// ---------------------------------------------------------------- Ana sayfa kartlari

describe('anaSayfaKartlari', () => {
    test('eski sunucu (kartlar yok): 4.5 davranisi, Gorevlerim surucude her zaman', () => {
        expect(anaSayfaKartlari({ kartlar: undefined, acikKayitVar: false, surucu: true, personel: false }))
            .toEqual({ gorevlerim: true, mesaiPlanlama: false, ipucu: null });
        expect(anaSayfaKartlari({ kartlar: null, acikKayitVar: true, surucu: false, personel: true }))
            .toEqual({ gorevlerim: false, mesaiPlanlama: false, ipucu: null });
    });

    test('mesai kapali: kart yok, ipucu yetkili kartlarla', () => {
        // 22.10.2026: Mesai Planlama mesai kapaliyken de gorunur; ipucu yalniz Gorevlerim'i sayar.
        expect(anaSayfaKartlari({ kartlar: ['MesaiPlanlama', 'Gorevlerim'], acikKayitVar: false, surucu: true, personel: true }))
            .toEqual({ gorevlerim: false, mesaiPlanlama: true, ipucu: 'Görevlerim mesainiz başlayınca açılır.' });
        expect(anaSayfaKartlari({ kartlar: ['MesaiPlanlama'], acikKayitVar: false, surucu: false, personel: true }))
            .toEqual({ gorevlerim: false, mesaiPlanlama: true, ipucu: null });
    });

    test('mesai kapali, karti olmayan depo personeli: ipucu yok', () => {
        expect(anaSayfaKartlari({ kartlar: [], acikKayitVar: false, surucu: false, personel: true }))
            .toEqual({ gorevlerim: false, mesaiPlanlama: false, ipucu: null });
    });

    test('mesai acik: yalniz yetkili kartlar', () => {
        expect(anaSayfaKartlari({ kartlar: ['MesaiPlanlama'], acikKayitVar: true, surucu: false, personel: true }))
            .toEqual({ gorevlerim: false, mesaiPlanlama: true, ipucu: null });
        expect(anaSayfaKartlari({ kartlar: ['Gorevlerim', 'Bilinmeyen'], acikKayitVar: true, surucu: true, personel: true }))
            .toEqual({ gorevlerim: true, mesaiPlanlama: false, ipucu: null });
    });

    test('personeli olmayan yalniz surucu: Gorevlerim yetkili sayilir (yine yalniz mesai acikken)', () => {
        expect(anaSayfaKartlari({ kartlar: [], acikKayitVar: true, surucu: true, personel: false }).gorevlerim).toBe(true);
        expect(anaSayfaKartlari({ kartlar: [], acikKayitVar: false, surucu: true, personel: false }))
            .toEqual({ gorevlerim: false, mesaiPlanlama: false, ipucu: 'Görevlerim mesainiz başlayınca açılır.' });
    });

    test('adlariBirlestir', () => {
        expect(adlariBirlestir([])).toBe('');
        expect(adlariBirlestir(['A'])).toBe('A');
        expect(adlariBirlestir(['A', 'B', 'C'])).toBe('A, B ve C');
    });
});

// ---------------------------------------------------------------- Para, donem

describe('paraMetni', () => {
    test('tr-TR bicim', () => {
        expect(paraMetni(0)).toBe('0,00 ₺');
        expect(paraMetni(1234.5)).toBe('1.234,50 ₺');
        expect(paraMetni(1234567.891)).toBe('1.234.567,89 ₺');
        expect(paraMetni(999.995)).toBe('1.000,00 ₺');
        expect(paraMetni(-12.3)).toBe('-12,30 ₺');
        expect(paraMetni(undefined)).toBe('0,00 ₺');
        expect(paraMetni(null)).toBe('0,00 ₺');
    });
});

describe('Mesai Gecmisim', () => {
    test('alacakGosterilir', () => {
        expect(alacakGosterilir(undefined, true)).toBe(false);
        expect(alacakGosterilir(null, true)).toBe(false);
        expect(alacakGosterilir(0, true)).toBe(true);
        expect(alacakGosterilir(0, false)).toBe(false);
        expect(alacakGosterilir(15, false)).toBe(true);
    });

    test('donemRozeti', () => {
        expect(donemRozeti('Açık')).toEqual({ metin: 'Açık dönem', ton: 'mavi' });
        expect(donemRozeti('Kapandı')).toEqual({ metin: 'Kapandı', ton: 'gri' });
        expect(donemRozeti(undefined)).toBeNull();
        expect(donemRozeti('  ')).toBeNull();
    });
});

// ---------------------------------------------------------------- Kademeli secim

const po = (customerId: string, customerName: string, divisionName: string | null, poName: string, poNo: string, companyPoId: string): MesaiPoSatiri =>
    ({ customerId, customerName, divisionName, poName, poNo, companyPoId, etiket: `${customerName} · ${divisionName ?? ''} · ${poName} · ${poNo}` });

const SATIRLAR: MesaiPoSatiri[] = [
    po('m1', 'Arçelik', 'Beyaz Eşya', 'Depo Hizmeti', '4500', 'p1'),
    po('m2', 'Vestel', 'TV', 'Ek Mesai', '7100', 'p2'),
    po('m1', 'Arçelik', 'Beyaz Eşya', 'Ek Mesai', '4501', 'p3'),
    po('m1', 'Arçelik', 'Klima', 'Ek Mesai', '4600', 'p4'),
    po('m3', 'Bosch', null, 'Genel', '9000', 'p5'),
];

describe('kademeli secim', () => {
    test('musteriler tekil, ilk gorulme sirasiyla', () => {
        expect(musteriListesi(SATIRLAR)).toEqual([
            { deger: 'm1', ad: 'Arçelik' },
            { deger: 'm2', ad: 'Vestel' },
            { deger: 'm3', ad: 'Bosch' },
        ]);
    });

    test('bolumler secili musteriye gore; bos bolum ayri ad', () => {
        expect(bolumListesi(SATIRLAR, 'm1')).toEqual([{ deger: 'Beyaz Eşya', ad: 'Beyaz Eşya' }, { deger: 'Klima', ad: 'Klima' }]);
        expect(bolumListesi(SATIRLAR, 'm3')).toEqual([{ deger: '', ad: BOLUMSUZ }]);
        expect(bolumListesi(SATIRLAR, undefined)).toEqual([]);
    });

    test('PO listesi musteri + bolume gore', () => {
        expect(poListesi(SATIRLAR, 'm1', 'Beyaz Eşya')).toEqual([{ deger: 'p1', ad: 'Depo Hizmeti · 4500' }, { deger: 'p3', ad: 'Ek Mesai · 4501' }]);
        expect(poListesi(SATIRLAR, 'm3', '')).toEqual([{ deger: 'p5', ad: 'Genel · 9000' }]);
        expect(poListesi(SATIRLAR, 'm1', undefined)).toEqual([]);
    });

    test('kendiliginden: tek secenek secilir, gecerli onceki korunur', () => {
        expect(kendiliginden([{ deger: 'a', ad: 'A' }], undefined)).toBe('a');
        expect(kendiliginden([{ deger: 'a', ad: 'A' }, { deger: 'b', ad: 'B' }], undefined)).toBeUndefined();
        expect(kendiliginden([{ deger: 'a', ad: 'A' }, { deger: 'b', ad: 'B' }], 'b')).toBe('b');
        expect(kendiliginden([{ deger: 'a', ad: 'A' }, { deger: 'b', ad: 'B' }], 'z')).toBeUndefined();
    });
});

// ---------------------------------------------------------------- Aralik

describe('saat araligi', () => {
    test('aralikCoz', () => {
        expect(aralikCoz('18:00-22:00')).toEqual({ baslangic: '18:00', bitis: '22:00' });
        expect(aralikCoz('8:30–12:00')).toEqual({ baslangic: '08:30', bitis: '12:00' });
        expect(aralikCoz('gecersiz')).toBeNull();
        expect(aralikCoz(undefined)).toBeNull();
    });

    test('aralikMetni', () => {
        expect(aralikMetni('18:00-22:00')).toBe('18:00 – 22:00');
    });
});

// ---------------------------------------------------------------- Doluluk / eksik

const talep = (p: Partial<MesaiTalebiItem>): MesaiTalebiItem => ({
    mesaiTalebiId: 't', tarih: '2026-10-18', tarihStr: '18.10.2026', mesaiNoktasiId: 'd', depoAdi: 'Depo', companyPoId: 'p',
    poEtiketi: '', customerName: 'M', divisionName: 'B', poName: 'PO', poNo: '1', kisiSayisi: 3, baslangic: '18:00', bitis: '22:00',
    aralik: '18:00–22:00', ayrilanlar: [], yerlesenler: [], yerlesenSayisi: 0, eksik: 3, siparis: null, tutar: 0, faturali: false,
    tamamlandi: false, giren: '', createdDate: '', ...p,
});

describe('doluluk', () => {
    test('yerlesen, gelmemis ayrilan, bos sirasi', () => {
        const t = talep({
            kisiSayisi: 4,
            yerlesenSayisi: 1,
            ayrilanlar: [{ personnelId: 'a', ad: 'Ali', geldi: false }, { personnelId: 'b', ad: 'Ayşe', geldi: true }],
        });

        expect(dolulukKutulari(t)).toEqual(['dolu', 'ayrilan', 'bos', 'bos']);
    });

    test('yerlesen kisi sayisini asarsa kutu yerlesen kadar', () => {
        expect(dolulukKutulari(talep({ kisiSayisi: 2, yerlesenSayisi: 3 }))).toEqual(['dolu', 'dolu', 'dolu']);
    });

    test('eksik sunucudan; yoksa kisi - yerlesen; en az 0', () => {
        expect(eksikSayisi(talep({ eksik: 2 }))).toBe(2);
        expect(eksikSayisi(talep({ eksik: undefined as unknown as number, kisiSayisi: 3, yerlesenSayisi: 1 }))).toBe(2);
        expect(eksikSayisi(talep({ eksik: -1 }))).toBe(0);
    });

    test('gunOzeti + metin', () => {
        const o = gunOzeti([talep({ eksik: 2 }), talep({ eksik: 0 }), talep({ eksik: 1 })]);

        expect(o).toEqual({ talep: 3, eksik: 3 });
        expect(gunOzetiMetni(o)).toBe('Bugün 3 talep · 3 kişi eksik');
        expect(gunOzetiMetni({ talep: 2, eksik: 0 })).toBe('Bugün 2 talep · eksik yok');
        expect(gunOzetiMetni({ talep: 0, eksik: 0 })).toBe('Bugün talep yok');
        expect(gunOzetiMetni(undefined)).toBe('Ek mesai taleplerini görün');
    });
});

// ---------------------------------------------------------------- Tarih, metin

describe('tarih ve metin', () => {
    test('tarihSecenekleri bugunden baslar', () => {
        const liste = tarihSecenekleri(new Date(2026, 9, 18, 15, 30), 3);

        expect(liste).toEqual([
            { deger: '2026-10-18', ad: '18.10.2026 · Bugün' },
            { deger: '2026-10-19', ad: '19.10.2026 · Yarın' },
            { deger: '2026-10-20', ad: '20.10.2026 · Salı' },
        ]);
    });

    test('ay sonu gecisi ve gunEkle', () => {
        expect(tarihSecenekleri(new Date(2026, 9, 31), 2)[1].deger).toBe('2026-11-01');
        expect(gunEkle(new Date(2026, 0, 1), -1)).toBe('2025-12-31');
        expect(trTarih('2026-10-18')).toBe('18.10.2026');
    });

    test('isTipiBuyuk Turkce buyuk harf', () => {
        expect(isTipiBuyuk('Lojistik')).toBe('LOJİSTİK');
        expect(isTipiBuyuk('Ambalaj')).toBe('AMBALAJ');
        expect(isTipiBuyuk(null)).toBe('');
    });

    test('saatte bulunma eki', () => {
        expect(saatte('18:30')).toBe("18:30'da");
        expect(saatte('08:00')).toBe("08:00'de");
        expect(saatte('13:40')).toBe("13:40'ta");
        expect(saatte('09:05')).toBe("09:05'te");
        expect(saatte(null)).toBe('');
    });
});

// #508 Mesai Talebi depo eslesmesi
import { depoSatirlari, varsayilanDepo } from '../src/utils/mesaiPlanlama';

describe('depo eşleşmesi', () => {
    const S = (companyPoId: string, customerId: string, divisionId: string, divisionName: string) =>
        ({ companyPoId, customerId, customerName: customerId + ' Müşteri', divisionId, divisionName, poName: 'Mesai', poNo: '1', etiket: '' });
    const satirlar = [S('x1', 'X', 'b1', 'Depo-1'), S('x2', 'X', 'b2', 'Depo-2'), S('y1', 'Y', 'b1', 'Depo-1')];

    it('eşleşme yoksa bütün satırlar', () => {
        expect(depoSatirlari(satirlar, { mesaiNoktasiId: 'A', ad: 'A' })).toHaveLength(3);
        expect(depoSatirlari(satirlar, undefined)).toHaveLength(3);
    });

    it('bölümsüz müşteri bütün bölümleri, bölümlü yalnız seçilenleri', () => {
        expect(depoSatirlari(satirlar, { mesaiNoktasiId: 'A', ad: 'A', musteriler: [{ musteriId: 'X', bolumIdleri: [] }] }).map(x => x.companyPoId)).toEqual(['x1', 'x2']);
        expect(depoSatirlari(satirlar, { mesaiNoktasiId: 'A', ad: 'A', musteriler: [{ musteriId: 'X', bolumIdleri: ['b2'] }] }).map(x => x.companyPoId)).toEqual(['x2']);
    });

    it('varsayılan depo: önceki seçim, sunucunun verdiği ya da tek depo', () => {
        const depolar = [{ mesaiNoktasiId: 'A', ad: 'A' }, { mesaiNoktasiId: 'B', ad: 'B' }];
        expect(varsayilanDepo(depolar, 'B')).toBe('B');
        expect(varsayilanDepo(depolar, null)).toBeUndefined();
        expect(varsayilanDepo(depolar, 'B', 'A')).toBe('A');
        expect(varsayilanDepo([{ mesaiNoktasiId: 'A', ad: 'A' }], null)).toBe('A');
    });
});
