import { bakiyeOzeti, BEKLIYOR, gunKodu, gunSayisi, istekDurumAdi, istekDurumTonu, izinTarihSecenekleri, ONAYLI, REDDEDILDI, rozetMetni, sayi } from '../src/utils/istek';
import { aralikCoz, aralikMetni, talepAralikMetni } from '../src/utils/mesaiPlanlama';
import { bildirimHedefi } from '../src/utils/mesaiDavet';

describe('istek durumu', () => {
    test('ad ve ton', () => {
        expect(istekDurumAdi(ONAYLI)).toBe('Onaylı');
        expect(istekDurumAdi(BEKLIYOR)).toBe('Onay bekliyor');
        expect(istekDurumAdi(4)).toBe('İptal edildi');
        expect(istekDurumAdi(undefined)).toBe('');
        expect(istekDurumTonu(BEKLIYOR)).toBe('amber');
        expect(istekDurumTonu(REDDEDILDI)).toBe('kirmizi');
        expect(istekDurumTonu(ONAYLI)).toBe('yesil');
    });
});

describe('gunSayisi', () => {
    test('iki tarih dahil, ay ve yil gecisi, ters aralik 0', () => {
        expect(gunSayisi('2026-11-03', '2026-11-03')).toBe(1);
        expect(gunSayisi('2026-11-28', '2026-12-02')).toBe(5);
        expect(gunSayisi('2026-12-31', '2027-01-01')).toBe(2);
        expect(gunSayisi('2026-11-05', '2026-11-03')).toBe(0);
        expect(gunSayisi(undefined, '2026-11-03')).toBe(0);
    });
});

describe('izinTarihSecenekleri', () => {
    test('geri ve ileri gunler, bugun isaretli', () => {
        const l = izinTarihSecenekleri(new Date(2026, 10, 3), 2, 3);
        expect(l).toHaveLength(6);
        expect(l[0].deger).toBe('2026-11-01');
        expect(l[2]).toEqual({ deger: '2026-11-03', ad: '03.11.2026 · Bugün' });
        expect(l[5].deger).toBe('2026-11-06');
    });
});

describe('bakiye ve gun kodu', () => {
    test('bakiye ozeti', () => {
        expect(bakiyeOzeti(null)).toBe('');
        const b = { personnelId: 'p', personelAdi: 'Ali', iseGirisTarihi: null, kidemYil: 2, yillikHak: 14, hakEdilen: 28, devreden: 3, kullanilan: 4, bekleyen: 2, kalan: 27, sonrakiHakTarihi: null, uyari: null };
        expect(bakiyeOzeti(b)).toBe('Devreden 3 · Hak edilen 28 · Kullanılan 4 · Onay bekleyen 2');
        expect(sayi(12.5)).toBe('12,5');
        expect(sayi(12)).toBe('12');
    });

    test('izin kodu vardiyadan once', () => {
        expect(gunKodu({ kod: 'S', izinKodu: 'Yİ' })).toBe('Yİ');
        expect(gunKodu({ kod: 'HT', izinKodu: null })).toBe('HT');
        expect(gunKodu({ kod: null, izinKodu: null })).toBe('—');
    });
});

describe('gece yarisini gecen talep', () => {
    test('aralikCoz 26:00 ve (+1) bicimini 02:00 olarak cozer', () => {
        expect(aralikCoz('22:00-26:00')).toEqual({ baslangic: '22:00', bitis: '02:00' });
        expect(aralikCoz('22:00–02:00 (+1)')).toEqual({ baslangic: '22:00', bitis: '02:00' });
        expect(aralikCoz('18:00-22:00')).toEqual({ baslangic: '18:00', bitis: '22:00' });
        expect(aralikCoz('25:00-26:00')).toBeNull();
    });

    test('aralik metni ertesi gunu (+1) ile yazar', () => {
        expect(aralikMetni('22:00-02:00')).toBe('22:00 – 02:00 (+1)');
        expect(aralikMetni('18:00-22:00')).toBe('18:00 – 22:00');
        expect(talepAralikMetni('22:00', '26:00')).toBe('22:00–02:00 (+1)');
        expect(talepAralikMetni('18:00', '20:00')).toBe('18:00–20:00');
    });
});

describe('bildirim yonlendirme', () => {
    test('istek bildirimleri onaylayiciya, kararlar Vardiyam ekranina', () => {
        expect(bildirimHedefi({ tur: 'izin_istek', istekId: 'x' })).toEqual({ ekran: 'IzinOnaylari', parametre: {} });
        expect(bildirimHedefi({ tur: 'takas_istek' })).toEqual({ ekran: 'IzinOnaylari', parametre: {} });
        expect(bildirimHedefi({ tur: 'izin_karar' })).toEqual({ ekran: 'Vardiyam', parametre: {} });
        expect(bildirimHedefi({ tur: 'takas_karar' })).toEqual({ ekran: 'Vardiyam', parametre: {} });
    });
});

describe('rozet ve izin tarihleri', () => {
    test('rozet: 0 ve gecersizde yok, 99 ustu 99+', () => {
        expect(rozetMetni(0)).toBeNull();
        expect(rozetMetni(undefined)).toBeNull();
        expect(rozetMetni(-2)).toBeNull();
        expect(rozetMetni(3)).toBe('3');
        expect(rozetMetni(120)).toBe('99+');
    });

    test('izin istegi bugunden baslar (gecmis gun yok)', () => {
        const l = izinTarihSecenekleri(new Date(2026, 10, 3), 0, 180);
        expect(l[0]).toEqual({ deger: '2026-11-03', ad: '03.11.2026 · Bugün' });
        expect(l).toHaveLength(181);
        expect(l.every(x => x.deger >= '2026-11-03')).toBe(true);
    });
});
