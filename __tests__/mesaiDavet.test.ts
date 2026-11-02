import { bildirimHedefi, DAVET_KALAMIYOR, DAVET_KALIYOR, davetDurumMetni, davetDurumTonu, davetSayiHatasi } from '../src/utils/mesaiDavet';

describe('bildirimHedefi', () => {
    it('davet bildirimi davet ekranini acar', () => {
        expect(bildirimHedefi({ tur: 'ek_mesai_davet', talepId: 't1' })).toEqual({ ekran: 'EkMesaiDavet', parametre: { mesaiTalebiId: 't1' } });
    });

    it('ret ve yanit yok davet yonetimini acar', () => {
        expect(bildirimHedefi({ tur: 'ek_mesai_red', talepId: 't1' })).toEqual({ ekran: 'EkMesaiDavetYonetim', parametre: { mesaiTalebiId: 't1' } });
        expect(bildirimHedefi({ tur: 'ek_mesai_yanit_yok', talepId: 't1' })?.ekran).toBe('EkMesaiDavetYonetim');
    });

    it('iptal, hatirlatma ve bos veri ekran acmaz', () => {
        expect(bildirimHedefi({ tur: 'ek_mesai_iptal', talepId: 't1' })).toBeUndefined();
        expect(bildirimHedefi({ tur: 'mesai_hatirlatma' })).toBeUndefined();
        expect(bildirimHedefi({ tur: 'ek_mesai_red' })).toBeUndefined();
        expect(bildirimHedefi(undefined)).toBeUndefined();
    });
});

describe('davet metinleri', () => {
    it('durum', () => {
        expect(davetDurumMetni(DAVET_KALIYOR)).toBe('Kalıyor');
        expect(davetDurumTonu(DAVET_KALAMIYOR)).toBe('kirmizi');
        expect(davetDurumMetni(null)).toBe('Davetsiz');
    });

    it('sayi kurali', () => {
        expect(davetSayiHatasi(2, 2)).toBeNull();
        expect(davetSayiHatasi(1, 2)).toBe('1 kişi daha seçiniz.');
        expect(davetSayiHatasi(3, 2)).toContain('1 kişiyi çıkarınız');
    });
});
