import {
    ayracGerekli, basHarfler, fotografAdi, geriAlinabilir, gonderilebilir, gunAyraci, kisiSuz, konusmaSuz, konusmayiGuncelle, listeZamani,
    mesajEkle, mesajOzeti, rozet, toplamOkunmamis,
} from '../src/utils/mesajlasma';
import { bildirimHedefi } from '../src/utils/mesaiDavet';
import { KonusmaOzeti, MesajSatiri } from '../src/types/mesaj.types';

// Firma ici mesajlasma 4.14 (#615): web ile ayni kurallar + mobil bildirim yonlendirmesi.

const m = (id: string, zaman: string, ek: Partial<MesajSatiri> = {}): MesajSatiri => ({
    id, konusmaId: 'k1', companyId: 'f', gonderenId: 'ali', gonderenAdi: 'Ali Veli', metin: 'selam', geriAlindi: false, zaman, okundu: false, ...ek,
});
const k = (id: string, ek: Partial<KonusmaOzeti> = {}): KonusmaOzeti => ({
    id, tur: 1, ad: id, surucu: false, okunmamis: 0, yonetici: false, uyeler: [], ...ek,
});

describe('zaman metinleri', () => {
    const simdi = new Date(2026, 10, 17, 15, 0);
    it('liste: bugun saat, dun, bu yil gun.ay, eski yil tam', () => {
        expect(listeZamani(new Date(2026, 10, 17, 9, 5).toISOString(), simdi)).toBe('09:05');
        expect(listeZamani(new Date(2026, 10, 16, 23, 0).toISOString(), simdi)).toBe('Dün');
        expect(listeZamani(new Date(2026, 2, 4).toISOString(), simdi)).toBe('04.03');
        expect(listeZamani(new Date(2025, 2, 4).toISOString(), simdi)).toBe('04.03.2025');
        expect(listeZamani(null, simdi)).toBe('');
    });
    it('gun ayraci ve ayrac gerekliligi', () => {
        expect(gunAyraci(new Date(2026, 10, 17, 1).toISOString(), simdi)).toBe('Bugün');
        expect(gunAyraci(new Date(2026, 10, 16, 1).toISOString(), simdi)).toBe('Dün');
        expect(gunAyraci(new Date(2026, 10, 2, 12).toISOString(), simdi)).toBe('2 Kasım 2026');
        const a = m('a', new Date(2026, 10, 16, 22).toISOString());
        const b = m('b', new Date(2026, 10, 17, 8).toISOString());
        const c = m('c', new Date(2026, 10, 17, 9).toISOString());
        expect(ayracGerekli(undefined, a)).toBe(true);
        expect(ayracGerekli(a, b)).toBe(true);
        expect(ayracGerekli(b, c)).toBe(false);
    });
});

describe('gonderim ve geri alma', () => {
    it('bos ve 4000 karakterden uzun metin gonderilmez', () => {
        expect(gonderilebilir('  ')).toBe(false);
        expect(gonderilebilir(' merhaba ')).toBe(true);
        expect(gonderilebilir('x'.repeat(4001))).toBe(false);
    });
    it('yalniz kendi mesaji, 5 dk icinde, geri alinmamissa', () => {
        const t = Date.UTC(2026, 10, 17, 12, 0);
        const benim = m('a', new Date(t - 4 * 60 * 1000).toISOString(), { gonderenId: 'ben' });
        expect(geriAlinabilir(benim, 'ben', t)).toBe(true);
        expect(geriAlinabilir({ ...benim, zaman: new Date(t - 6 * 60 * 1000).toISOString() }, 'ben', t)).toBe(false);
        expect(geriAlinabilir(benim, 'baska', t)).toBe(false);
        expect(geriAlinabilir({ ...benim, geriAlindi: true }, 'ben', t)).toBe(false);
    });
    it('mesaj ekle: ayni Id guncellenir, zamana gore sirali', () => {
        let l = [m('b', '2026-11-17T10:00:00Z')];
        l = mesajEkle(l, m('a', '2026-11-17T09:00:00Z'));
        l = mesajEkle(l, m('b', '2026-11-17T10:00:00Z', { okundu: true }));
        expect(l.map(x => x.id)).toEqual(['a', 'b']);
        expect(l[1].okundu).toBe(true);
    });
});

describe('liste', () => {
    it('ozet: geri alinan, fotograf, fotograf + aciklama', () => {
        expect(mesajOzeti(m('a', 'z', { geriAlindi: true }))).toBe('Bu mesaj geri alındı');
        expect(mesajOzeti(m('a', 'z', { metin: null, dosyaAdi: 'foto.jpg', dosyaResim: true }))).toBe('📷 Fotoğraf');
        expect(mesajOzeti(m('a', 'z', { metin: 'kapı  önü', dosyaAdi: 'foto.jpg', dosyaResim: true }))).toBe('📷 kapı önü');
    });
    it('yeni mesaj: basa alinir, baskasindan ve kapali sohbette okunmamis artar', () => {
        const l = [k('k0'), k('k1', { okunmamis: 2 })];
        const g = konusmayiGuncelle(l, m('a', '2026-11-17T10:00:00Z'), 'ben', undefined);
        expect(g[0].id).toBe('k1');
        expect(g[0].okunmamis).toBe(3);
        expect(g[0].sonGonderen).toBe('Ali Veli');
        expect(konusmayiGuncelle(l, m('a', 'z'), 'ben', 'k1')[0].okunmamis).toBe(0);
        expect(konusmayiGuncelle(l, m('a', 'z', { gonderenId: 'ben' }), 'ben', undefined)[0].sonGonderen).toBe('Siz');
        expect(toplamOkunmamis(l)).toBe(2);
    });
    it('filtre, arama (Turkce harf), sabitlenen ustte', () => {
        const l = [
            k('a', { ad: 'Şoför Grubu', tur: 2, sonMesajZamani: '2026-11-17T09:00:00Z' }),
            k('b', { ad: 'İsmail', okunmamis: 1, sonMesajZamani: '2026-11-17T11:00:00Z' }),
            k('c', { ad: 'Ofis', sabitlemeZamani: '2026-11-01T00:00:00Z', sonMesajZamani: '2026-11-10T00:00:00Z' }),
        ];
        expect(konusmaSuz(l, 'tumu', '').map(x => x.id)).toEqual(['c', 'b', 'a']);
        expect(konusmaSuz(l, 'okunmamis', '').map(x => x.id)).toEqual(['b']);
        expect(konusmaSuz(l, 'gruplar', '').map(x => x.id)).toEqual(['a']);
        expect(konusmaSuz(l, 'tumu', 'şoför').map(x => x.id)).toEqual(['a']);
        expect(konusmaSuz(l, 'tumu', 'ismail').map(x => x.id)).toEqual(['b']);
        expect(kisiSuz([{ ad: 'Zeynep' }, { ad: 'Ahmet' }, { ad: 'Çağrı' }], '').map(x => x.ad)).toEqual(['Ahmet', 'Çağrı', 'Zeynep']);
    });
    it('rozet, bas harfler, fotograf adi', () => {
        expect(rozet(0)).toBe('');
        expect(rozet(7)).toBe('7');
        expect(rozet(150)).toBe('99+');
        expect(basHarfler('ali veli kaya')).toBe('AV');
        expect(fotografAdi(new Date(2026, 10, 17, 15, 30, 5))).toBe('foto-20261117-153005.jpg');
    });
});

describe('bildirim yonlendirmesi', () => {
    it('mesaj bildirimi sohbeti, konusma yoksa listeyi acar', () => {
        expect(bildirimHedefi({ tur: 'mesaj', konusmaId: 'k9' })).toEqual({ ekran: 'Sohbet', parametre: { konusmaId: 'k9' } });
        expect(bildirimHedefi({ tur: 'mesaj' })).toEqual({ ekran: 'Mesajlar', parametre: {} });
    });
});
