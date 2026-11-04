import { AppState, Linking, NativeModules, Platform } from 'react-native';

/**
 * Yerel Cihaz modulu sarmalayicisi (04.11.2026, #542 / #545). Modul yalniz Android'de var
 * (android/.../cihaz/CihazModule.kt); iOS'ta ya da modulsuz eski derlemede guvenli varsayilan doner.
 */
type CihazModulu = {
    konumAcikMi?: () => Promise<boolean>
    guncellemeBaslat?: () => Promise<string>
};

const modul = (): CihazModulu | undefined => (Platform.OS === 'android' ? NativeModules.Cihaz : undefined);

/**
 * Telefonun konum servisi acik mi (izin degil, servisin kendisi). Yalniz Android'de olculur;
 * iOS'ta ya da olculemezse undefined (bilinmiyor) doner.
 */
export const konumAcikMi = async (): Promise<boolean | undefined> => {
    const m = modul();

    if (!m?.konumAcikMi)
        return undefined;

    try {
        return await m.konumAcikMi();
    } catch {
        return undefined;
    }
};

export type GuncellemeBaslatmaSonucu = 'baslatildi' | 'yok' | 'hata';

/** Google Play uygulama ici guncelleme (IMMEDIATE). iOS'ta / modul yoksa 'yok'. */
export const guncellemeBaslat = async (): Promise<GuncellemeBaslatmaSonucu> => {
    const m = modul();

    if (!m?.guncellemeBaslat)
        return 'yok';

    try {
        const sonuc = await m.guncellemeBaslat();

        return sonuc === 'baslatildi' || sonuc === 'yok' ? sonuc : 'hata';
    } catch {
        return 'hata';
    }
};

/**
 * Konum ayarlarini acar. Android: dogrudan "Konum" ayar sayfasi (olmazsa uygulama ayarlari).
 * iOS Konum Servisleri sayfasini dogrudan acmaya izin vermez; uygulamanin ayar sayfasi acilir.
 */
export const konumAyarlariniAc = async () => {
    if (Platform.OS === 'android') {
        try {
            await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
            return;
        } catch {
            // Bazi ureticilerde sayfa yok: uygulama ayarlarina dusulur.
        }
    }

    await Linking.openSettings().catch(() => undefined);
};

/**
 * Uygulama arka plana gidip (ayarlar acildi) tekrar one gelince bir kez calisir.
 * Donen fonksiyon dinleyiciyi iptal eder (ekran kapanirsa ya da kullanici vazgecerse).
 */
export const oneGelince = (_islem: () => void): (() => void) => {
    let ayrildi = AppState.currentState !== 'active';
    let bitti = false;

    const abonelik = AppState.addEventListener('change', durum => {
        if (bitti)
            return;

        if (durum !== 'active') {
            ayrildi = true;
            return;
        }

        if (!ayrildi)
            return;

        bitti = true;
        abonelik.remove();
        _islem();
    });

    return () => {
        if (bitti)
            return;

        bitti = true;
        abonelik.remove();
    };
};
