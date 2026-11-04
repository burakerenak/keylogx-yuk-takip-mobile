// #545 Acilista guncelleme kontrolu: sunucu yaniti -> pencere karari ve metni.
import { ANDROID_MAGAZA_ADRESI, SurumKontrolYaniti, guncellemeKarari, guncellemeMetni, magazaAdresiSec, surumYanitiniAc } from '../src/utils/guncelleme';

const yanit = (_ek: Partial<SurumKontrolYaniti> = {}): SurumKontrolYaniti => ({
    guncellemeVar: true,
    zorunlu: false,
    sonSurum: '4.13',
    magazaAdresi: null,
    aciklama: null,
    ..._ek,
});

describe('surumYanitiniAc', () => {
    test('ApiResponse sarmalayicisindan veri', () => {
        expect(surumYanitiniAc({ isSuccess: true, data: { guncellemeVar: true, zorunlu: true, sonSurum: '4.13' } }))
            .toEqual({ guncellemeVar: true, zorunlu: true, sonSurum: '4.13', magazaAdresi: null, aciklama: null });
    });

    test('basarisiz / bos / bozuk yanit sessizce gecilir', () => {
        expect(surumYanitiniAc({ isSuccess: false, message: 'x' })).toBeUndefined();
        expect(surumYanitiniAc({ isSuccess: true, data: null })).toBeUndefined();
        expect(surumYanitiniAc(null)).toBeUndefined();
        expect(surumYanitiniAc('metin')).toBeUndefined();
    });
});

describe('guncellemeKarari', () => {
    test('yanit yok ya da guncelleme yok -> yok', () => {
        expect(guncellemeKarari(undefined, false)).toBe('yok');
        expect(guncellemeKarari(yanit({ guncellemeVar: false, zorunlu: true }), false)).toBe('yok');
    });

    test('istege bagli: Sonra denince bu acilista tekrar sorulmaz', () => {
        expect(guncellemeKarari(yanit(), false)).toBe('istege');
        expect(guncellemeKarari(yanit(), true)).toBe('yok');
    });

    test('zorunlu: ertelense de sorulur', () => {
        expect(guncellemeKarari(yanit({ zorunlu: true }), true)).toBe('zorunlu');
    });
});

describe('magazaAdresiSec', () => {
    test('sunucudaki adres oncelikli', () => {
        expect(magazaAdresiSec(yanit({ magazaAdresi: ' https://apps.apple.com/app/id1 ' }), 'ios')).toBe('https://apps.apple.com/app/id1');
    });

    test('bos adres: Android Play sayfasi, iOS yok', () => {
        expect(magazaAdresiSec(yanit({ magazaAdresi: '' }), 'android')).toBe(ANDROID_MAGAZA_ADRESI);
        expect(magazaAdresiSec(yanit(), 'ios')).toBeNull();
    });
});

describe('guncellemeMetni', () => {
    test('surum + aciklama', () => {
        expect(guncellemeMetni(yanit({ aciklama: 'Hata düzeltmeleri' }), 'x')).toBe('Sürüm 4.13 yayımlandı.\n\nHata düzeltmeleri');
    });

    test('adres yoksa magaza notu; surum yoksa genel metin', () => {
        expect(guncellemeMetni(yanit({ sonSurum: null }), null)).toBe('Yeni sürüm yayımlandı.\n\nMağazadan güncelleyiniz.');
    });
});
