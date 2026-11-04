// #541 Cikis: once bildirim adresi silinir (en cok ~3 sn, hata yutulur), sonra hatirlanan kullanici, en son oturum.
import { oturumuKapatAkisi, zamanAsimiyla } from '../src/utils/oturum';

const kayitli = () => {
    const sira: string[] = [];
    return {
        sira,
        adimlar: (_adresiSil: () => Promise<unknown>) => ({
            adresiSil: () => { sira.push('adresiSil'); return _adresiSil(); },
            kullaniciyiSil: async () => { sira.push('kullaniciyiSil'); },
            cikis: () => { sira.push('cikis'); },
        }),
    };
};

test('sira: adres sil -> kullanici sil -> cikis', async () => {
    const k = kayitli();
    await oturumuKapatAkisi(k.adimlar(async () => undefined), 50);
    expect(k.sira).toEqual(['adresiSil', 'kullaniciyiSil', 'cikis']);
});

test('adres silme hatasi cikisi engellemez', async () => {
    const k = kayitli();
    await oturumuKapatAkisi(k.adimlar(() => Promise.reject(new Error('401'))), 50);
    expect(k.sira).toEqual(['adresiSil', 'kullaniciyiSil', 'cikis']);
});

test('adres silme yanit vermezse sure dolunca cikis yapilir', async () => {
    const k = kayitli();
    const basla = Date.now();
    await oturumuKapatAkisi(k.adimlar(() => new Promise(() => undefined)), 60);
    expect(Date.now() - basla).toBeGreaterThanOrEqual(50);
    expect(k.sira).toEqual(['adresiSil', 'kullaniciyiSil', 'cikis']);
});

test('depo silme hatasi da cikisi engellemez', async () => {
    const sira: string[] = [];
    await oturumuKapatAkisi({
        adresiSil: async () => { sira.push('adresiSil'); },
        kullaniciyiSil: async () => { throw new Error('keychain'); },
        cikis: () => { sira.push('cikis'); },
    }, 50);
    expect(sira).toEqual(['adresiSil', 'cikis']);
});

test('zamanAsimiyla: es zamanli hata da yutulur', async () => {
    await expect(zamanAsimiyla(() => { throw new Error('x'); }, 20)).resolves.toBeUndefined();
});
