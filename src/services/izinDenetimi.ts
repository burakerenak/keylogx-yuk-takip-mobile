import { Linking, Platform } from 'react-native';
import { PERMISSIONS, checkMultiple, check, checkNotifications, request, requestMultiple } from 'react-native-permissions';
import notificationService from './notificationService';
import { konumAcikMi, konumAyarlariniAc } from '../utils/cihaz';
import { IzinSatirAdi, IzinSatiri, IzinSonucu, eksikVarMi, izinSatiri, konumIzniBirlesik, konumServisiSatiri, sonIstekleBirlestir } from '../utils/izinler';
import { navigationRef } from '../navigation/navigationRef';

/**
 * Izin denetimi (04.11.2026, #542): giristen sonra ve uygulama her acildiginda (oturum acikken) eksik izin varsa
 * Izinler ekrani acilir. "Daha sonra" yalniz bellekte tutulur: sonraki acilista eksik varsa yine sorulur.
 */

const KONUM_ANDROID = [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION];
const KAMERA = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

/** Son istek sonuclari (Android'de kalici red yalniz request() sonucunda gorulur). */
const sonIstekler: Partial<Record<IzinSatirAdi, IzinSonucu>> = {};

let ertelendi = false;

/** "Daha sonra": bu acilista (uygulama kapanana / cikis yapilana kadar) Izinler ekrani kendiliginden acilmaz. */
export const izinleriErtele = () => { ertelendi = true; };

/** Cikis yapilinca sonraki giriste yeniden sorulur. */
export const izinErtelemesiniSifirla = () => { ertelendi = false; };

const guvenli = async (_islem: () => Promise<IzinSonucu>): Promise<IzinSonucu> => {
    try {
        return await _islem();
    } catch {
        return 'unavailable';
    }
};

const konumIzniOlc = () => guvenli(async () => {
    if (Platform.OS === 'android') {
        const sonuc = await checkMultiple(KONUM_ANDROID);

        return konumIzniBirlesik(KONUM_ANDROID.map(x => sonuc[x]));
    }

    return await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
});

/** Satirlarin guncel durumu. Konum servisi satiri yalniz Android'de (iOS'ta olculemez). */
export const izinleriOlc = async (): Promise<IzinSatiri[]> => {
    const [konum, bildirim, kamera, servis] = await Promise.all([
        konumIzniOlc(),
        guvenli(async () => (await checkNotifications()).status),
        guvenli(() => check(KAMERA)),
        konumAcikMi(),
    ]);

    const satirlar: IzinSatiri[] = [
        // iOS'ta konum "unavailable" = telefonun Konum Servisleri kapali: eksik, ayarlardan acilir.
        izinSatiri('konumIzni', sonIstekleBirlestir(konum, sonIstekler.konumIzni), Platform.OS === 'ios'),
    ];

    if (Platform.OS === 'android')
        satirlar.push(konumServisiSatiri(servis));

    satirlar.push(izinSatiri('bildirim', sonIstekleBirlestir(bildirim, sonIstekler.bildirim)));
    satirlar.push(izinSatiri('kamera', sonIstekleBirlestir(kamera, sonIstekler.kamera)));

    return satirlar;
};

/** Satirin dugmesi: izin penceresi, ayarlar ya da konum ayarlari. Sonuc ekranda yeniden olculur. */
export const satirIslemi = async (_satir: IzinSatiri) => {
    if (_satir.dugme === 'ayarlariAc') {
        await Linking.openSettings().catch(() => undefined);
        return;
    }

    if (_satir.dugme === 'konumuAc') {
        await konumAyarlariniAc();
        return;
    }

    if (_satir.dugme !== 'izinVer')
        return;

    if (_satir.ad === 'konumIzni') {
        sonIstekler.konumIzni = await guvenli(async () => {
            if (Platform.OS === 'android') {
                const sonuc = await requestMultiple(KONUM_ANDROID);

                return konumIzniBirlesik(KONUM_ANDROID.map(x => sonuc[x]));
            }

            return await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        });
    }
    else if (_satir.ad === 'bildirim')
        sonIstekler.bildirim = await notificationService.izinIste();
    else if (_satir.ad === 'kamera')
        sonIstekler.kamera = await guvenli(() => request(KAMERA));
};

const bekle = (_ms: number) => new Promise<void>(resolve => setTimeout(() => resolve(), _ms));

/**
 * Eksik izin varsa Izinler ekranini acar (oturum acilinca: giris ya da kayitli kullaniciyla acilis).
 * Ertelendiyse ya da ekran zaten aciksa bir sey yapmaz; hata sessizce yutulur.
 */
export const eksikIzinVarsaAc = async () => {
    try {
        if (ertelendi)
            return;

        const satirlar = await izinleriOlc();

        if (!eksikVarMi(satirlar) || ertelendi)
            return;

        // Gezinme yigini yeni kuruluyor olabilir (girisin hemen ardindan).
        for (let i = 0; i < 30 && !navigationRef.isReady(); i++)
            await bekle(100);

        if (!navigationRef.isReady() || navigationRef.getCurrentRoute()?.name === 'Izinler')
            return;

        navigationRef.navigate('Izinler');
    } catch {
        // Denetim uygulamayi durdurmaz.
    }
};
