/**
 * Acilista guncelleme kontrolu saf kurallari (04.11.2026, #545). Surum karsilastirmasi sunucuda yapilir;
 * mobil yalniz sunucunun guncellemeVar / zorunlu bayraklarina guvenir.
 */

/** POST MobilSurum/Kontrol yanitinin veri kismi. */
export type SurumKontrolYaniti = {
    guncellemeVar: boolean
    zorunlu: boolean
    sonSurum: string | null
    magazaAdresi: string | null
    aciklama: string | null
};

/** Android magaza adresi bos gelirse (uygulamanin Play sayfasi). */
export const ANDROID_MAGAZA_ADRESI = 'market://details?id=com.ebbedev.cargotrackingmobile';

/** Sunucu yanit sarmalayicisi (ApiResponse) -> veri; basarisiz / bozuk yanit undefined. */
export const surumYanitiniAc = (_govde: unknown): SurumKontrolYaniti | undefined => {
    const g = _govde as { isSuccess?: boolean, data?: Partial<SurumKontrolYaniti> | null } | null | undefined;

    if (!g || g.isSuccess === false || !g.data || typeof g.data !== 'object')
        return undefined;

    return {
        guncellemeVar: g.data.guncellemeVar === true,
        zorunlu: g.data.zorunlu === true,
        sonSurum: g.data.sonSurum ?? null,
        magazaAdresi: g.data.magazaAdresi ?? null,
        aciklama: g.data.aciklama ?? null,
    };
};

export type GuncellemeKarari = 'yok' | 'istege' | 'zorunlu';

/** ertelendi: kullanici bu acilista "Sonra" dedi (zorunlu guncellemede yok sayilir). */
export const guncellemeKarari = (_yanit: SurumKontrolYaniti | undefined, _ertelendi: boolean): GuncellemeKarari => {
    if (!_yanit?.guncellemeVar)
        return 'yok';

    if (_yanit.zorunlu)
        return 'zorunlu';

    return _ertelendi ? 'yok' : 'istege';
};

/** "Güncelle" dugmesinin acacagi adres: sunucudaki; bossa Android'de Play sayfasi, iOS'ta yok (dugme gosterilmez). */
export const magazaAdresiSec = (_yanit: SurumKontrolYaniti, _platform: string): string | null => {
    const adres = (_yanit.magazaAdresi ?? '').trim();

    if (adres)
        return adres;

    return _platform === 'android' ? ANDROID_MAGAZA_ADRESI : null;
};

/** Pencere metni: surum + aciklama; adres yoksa "Mağazadan güncelleyiniz." */
export const guncellemeMetni = (_yanit: SurumKontrolYaniti, _adres: string | null): string => {
    const surum = (_yanit.sonSurum ?? '').trim();
    const parcalar = [surum ? `Sürüm ${surum} yayımlandı.` : 'Yeni sürüm yayımlandı.'];
    const aciklama = (_yanit.aciklama ?? '').trim();

    if (aciklama)
        parcalar.push(aciklama);

    if (!_adres)
        parcalar.push('Mağazadan güncelleyiniz.');

    return parcalar.join('\n\n');
};
