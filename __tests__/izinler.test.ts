// #542 Izinler ekrani: izin sonucu -> satir durumu / dugme eslemesi.
import { eksikVarMi, izinSatiri, konumIzniBirlesik, konumServisiSatiri, sonIstekleBirlestir } from '../src/utils/izinler';

describe('izinSatiri', () => {
    test('granted ve limited tamam, dugme yok', () => {
        expect(izinSatiri('kamera', 'granted')).toEqual({ ad: 'kamera', tamam: true, dugme: null });
        expect(izinSatiri('konumIzni', 'limited')).toEqual({ ad: 'konumIzni', tamam: true, dugme: null });
    });

    test('denied istenebilir: İzin ver', () => {
        expect(izinSatiri('bildirim', 'denied')).toEqual({ ad: 'bildirim', tamam: false, dugme: 'izinVer' });
    });

    test('blocked kalici red: Ayarları aç', () => {
        expect(izinSatiri('kamera', 'blocked')).toEqual({ ad: 'kamera', tamam: false, dugme: 'ayarlariAc' });
    });

    test('unavailable varsayilan tamam; iOS konumda (servis kapali) eksik + ayarlar', () => {
        expect(izinSatiri('kamera', 'unavailable').tamam).toBe(true);
        expect(izinSatiri('konumIzni', 'unavailable', true)).toEqual({ ad: 'konumIzni', tamam: false, dugme: 'ayarlariAc' });
    });
});

describe('konumIzniBirlesik (FINE + COARSE, biri yeterli)', () => {
    test('biri granted ise granted', () => {
        expect(konumIzniBirlesik(['denied', 'granted'])).toBe('granted');
        expect(konumIzniBirlesik(['granted', 'blocked'])).toBe('granted');
    });

    test('ikisi de yoksa: biri blocked ise blocked, yoksa denied', () => {
        expect(konumIzniBirlesik(['blocked', 'denied'])).toBe('blocked');
        expect(konumIzniBirlesik(['denied', 'denied'])).toBe('denied');
    });

    test('hepsi unavailable ise unavailable', () => {
        expect(konumIzniBirlesik(['unavailable', 'unavailable'])).toBe('unavailable');
    });
});

test('Android check() kalici reddi gormez: son istek blocked ise satir blocked', () => {
    expect(sonIstekleBirlestir('denied', 'blocked')).toBe('blocked');
    expect(sonIstekleBirlestir('denied', undefined)).toBe('denied');
    expect(sonIstekleBirlestir('granted', 'blocked')).toBe('granted');
});

test('konum servisi: kapali -> Konumu aç; olculemedi -> tamam', () => {
    expect(konumServisiSatiri(false)).toEqual({ ad: 'konumServisi', tamam: false, dugme: 'konumuAc' });
    expect(konumServisiSatiri(true).tamam).toBe(true);
    expect(konumServisiSatiri(undefined).tamam).toBe(true);
});

test('eksikVarMi', () => {
    expect(eksikVarMi([izinSatiri('kamera', 'granted'), konumServisiSatiri(true)])).toBe(false);
    expect(eksikVarMi([izinSatiri('kamera', 'granted'), izinSatiri('bildirim', 'denied')])).toBe(true);
});
