import { bildirimHedefi, DAVET_KALAMIYOR, DAVET_KALIYOR, davetDurumMetni, davetDurumTonu, davetSayiHatasi , onayAkisinda } from '../src/utils/mesaiDavet';

describe('onayAkisinda', () => {
    it('bekliyor ve revize akista, onayli ve bos degil', () => {
        expect(onayAkisinda(1)).toBe(true);
        expect(onayAkisinda(3)).toBe(true);
        expect(onayAkisinda(2)).toBe(false);
        expect(onayAkisinda(null)).toBe(false);
    });
});

describe('bildirimHedefi', () => {
    it('onay bildirimi Onayda Bekleyenler sekmesini acar', () => {
        expect(bildirimHedefi({ tur: 'ek_mesai_onay', talepId: 't1' })).toEqual({ ekran: 'MesaiPlanlama', parametre: { sekme: 'onay' } });
    });

    it('revize bildirimi talebi duzeltme ekranini acar', () => {
        expect(bildirimHedefi({ tur: 'ek_mesai_revize', talepId: 't1' })).toEqual({ ekran: 'MesaiTalebiYeni', parametre: { mesaiTalebiId: 't1' } });
    });

    it('onaylandi bildirimi Mesai Planlama acar', () => {
        expect(bildirimHedefi({ tur: 'ek_mesai_onaylandi', talepId: 't1' })).toEqual({ ekran: 'MesaiPlanlama', parametre: {} });
    });

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
