import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

export type KonumSonucu =
    | { durum: 'tamam', lat: number, lon: number, dogruluk: number }
    /** Kullanici konum iznini vermedi (ya da kalici reddetti). */
    | { durum: 'izinYok' }
    /** Izin var ama konum alinamadi (konum servisi kapali, zaman asimi). */
    | { durum: 'alinamadi' };

export type KonumDurumu = KonumSonucu['durum'];

type KonumSecenekleri = { enableHighAccuracy: boolean, timeout: number, maximumAge: number };

/** Tek getCurrentPosition denemesi; hata / zaman asiminda undefined doner. */
const konumDene = (_secenekler: KonumSecenekleri) =>
    new Promise<KonumSonucu | undefined>(resolve => {
        try {
            Geolocation.getCurrentPosition(
                position => resolve({
                    durum: 'tamam',
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    dogruluk: position.coords.accuracy,
                }),
                () => resolve(undefined),
                _secenekler,
            );
        } catch {
            resolve(undefined);
        }
    });

/**
 * Anlik konum: mesai QR ile yukleme / teslim adimlarinin ortak yardimcisi.
 * - Android: hassas (FINE) ya da yaklasik (COARSE) izinden biri yeterli; Android 12+ "yaklasik konum"
 *   secen kullanici da konum gonderebilsin.
 * - Once hassas konum denenir; olmazsa (kapali alanda GPS gelmedi, zaman asimi) ag / son bilinen konum denenir.
 * - Izin yok ile konum alinamadi ayri doner; dogruluk metre cinsindendir.
 */
export const anlikKonum = async (): Promise<KonumSonucu> => {
    try {
        if (Platform.OS === 'android') {
            const sonuc = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ]);

            const hassas = sonuc[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
            const yaklasik = sonuc[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

            if (!hassas && !yaklasik)
                return { durum: 'izinYok' };
        }
        else {
            const sonuc = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

            if (sonuc !== RESULTS.GRANTED)
                return { durum: 'izinYok' };
        }

        const ilk = await konumDene({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });

        if (ilk)
            return ilk;

        const yedek = await konumDene({ enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 });

        return yedek ?? { durum: 'alinamadi' };
    } catch {
        return { durum: 'alinamadi' };
    }
};

/**
 * Yukleme / teslim adim isteklerinin konum alanlari. Konum alinamasa da istek gonderilir (lat/lon bos);
 * sunucu arac takip cihazina da bakar ve gerekirse izin kapali / GPS yok ayrimiyla mesaj doner.
 */
export const konumAlanlari = (_konum: KonumSonucu) => ({
    lat: _konum.durum === 'tamam' ? _konum.lat : undefined,
    lon: _konum.durum === 'tamam' ? _konum.lon : undefined,
    dogruluk: _konum.durum === 'tamam' ? _konum.dogruluk : null,
    konumDurumu: _konum.durum,
});
