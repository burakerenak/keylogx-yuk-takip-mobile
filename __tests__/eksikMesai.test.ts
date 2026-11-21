import { EKSIK_MESAI_METNI, eksikMesaiHedefi, eksikSayisi, eksikUyarisi, gunleriSuz } from '../src/utils/eksikMesai';
import { bildirimHedefi } from '../src/utils/mesaiDavet';
import { MesaiGecmisGun, MesaiKaydiOzet } from '../src/types/mesai.types';

const kayit = (id: string, durum: 1 | 2 | 3, uyari?: string | null) =>
    ({ mesaiKaydiId: id, durum, uyari, durumAdi: '', tur: 1, noktaAdi: 'Depo', tarih: '2026-11-20', girisSaati: '08:00', girisZamani: '', cikisSaati: null, normalDk: 0, ekDk: 0, sureDk: 0 } as unknown as MesaiKaydiOzet);

const gunler: MesaiGecmisGun[] = [
    { tarih: '2026-11-21', gunAdi: 'cumartesi', sureDk: 540, normalDk: 540, ekDk: 0, kayitlar: [kayit('a', 2)] },
    { tarih: '2026-11-20', gunAdi: 'cuma', sureDk: 300, normalDk: 300, ekDk: 0, kayitlar: [kayit('b', 2), kayit('c', 3)] },
    { tarih: '2026-11-19', gunAdi: 'perşembe', sureDk: 0, normalDk: 0, ekDk: 0, kayitlar: [kayit('d', 3)] },
];

describe('Eksik Mesai suzgeci', () => {
    it('kapaliyken liste aynen doner', () => {
        expect(gunleriSuz(gunler, false)).toBe(gunler);
    });

    it('aciksa yalniz eksik kayitlar kalir, eksigi olmayan gun cikar', () => {
        const l = gunleriSuz(gunler, true);
        expect(l.map(g => g.tarih)).toEqual(['2026-11-20', '2026-11-19']);
        expect(l[0].kayitlar.map(k => k.mesaiKaydiId)).toEqual(['c']);
    });

    it('eksik sayisi', () => {
        expect(eksikSayisi(gunler)).toBe(2);
        expect(eksikSayisi([])).toBe(0);
    });
});

describe('Eksik Mesai yazili uyari', () => {
    it('sunucu metni once, eski sunucuda eksik kayitta sabit metin, digerlerinde yok', () => {
        expect(eksikUyarisi(kayit('x', 3, 'Sunucu metni'))).toBe('Sunucu metni');
        expect(eksikUyarisi(kayit('x', 3))).toBe(EKSIK_MESAI_METNI);
        expect(EKSIK_MESAI_METNI).toBe('Mesai kapaması yapılmadığı için mesai ücreti alamayacaksınız.');
        expect(eksikUyarisi(kayit('x', 2))).toBeNull();
        expect(eksikUyarisi(kayit('x', 1))).toBeNull();
    });
});

describe('Eksik Mesai bildirimi', () => {
    it('dokununca o ayin Mesai Gecmisim gunleri yalniz eksiklerle acilir', () => {
        const h = { ekran: 'MesaiGecmisiGun', parametre: { yil: 2026, ay: 11, donemAdi: 'Kasım 2026', yalnizEksik: true } };
        expect(eksikMesaiHedefi({ tur: 'eksik_mesai', tarih: '2026-11-20', mesaiKaydiId: 'k1' })).toEqual(h);
        expect(bildirimHedefi({ tur: 'eksik_mesai', tarih: '2026-11-20' })).toEqual(h);
    });

    it('tarih yoksa ya da bozuksa ekran acilmaz', () => {
        expect(bildirimHedefi({ tur: 'eksik_mesai' })).toBeUndefined();
        expect(eksikMesaiHedefi({ tarih: '2026-13-01' })).toBeUndefined();
        expect(eksikMesaiHedefi(null)).toBeUndefined();
    });
});
