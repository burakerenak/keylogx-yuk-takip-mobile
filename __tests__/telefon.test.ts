import { telefonAramaAdresi } from '../src/utils/telefonAdres';

test('parantezli yurt ici numaraya 0 eklenir', () => {
    expect(telefonAramaAdresi('(505) 120-70-80')).toBe('tel:05051207080');
});

test('0 ile baslayan numara oldugu gibi', () => {
    expect(telefonAramaAdresi('0212 555 44 33')).toBe('tel:02125554433');
});

test('+90 uluslararasi numara korunur', () => {
    expect(telefonAramaAdresi('+90 532 111 22 33')).toBe('tel:+905321112233');
});

test('bos ya da cok kisa numara arama yapmaz', () => {
    expect(telefonAramaAdresi('')).toBeUndefined();
    expect(telefonAramaAdresi(undefined)).toBeUndefined();
    expect(telefonAramaAdresi('12')).toBeUndefined();
});
