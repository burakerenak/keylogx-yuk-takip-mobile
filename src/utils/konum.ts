import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

export type KonumSonucu =
    | { durum: 'tamam', lat: number, lon: number, dogruluk: number }
    /** Kullanici konum iznini vermedi (ya da kalici reddetti). */
    | { durum: 'izinYok' }
    /** Izin var ama konum alinamadi (konum servisi kapali, zaman asimi). */
    | { durum: 'alinamadi' };

/**
 * 4.4 QR mesai: anlik konum. Izin ve getCurrentPosition kalibi OrderScreen'deki yukleme / teslim
 * konum kontrolunun aynisidir; farki izin yok ile konum alinamadi durumlarini ayri dondurmesi.
 */
export const anlikKonum = async (): Promise<KonumSonucu> => {
    try {
        if (Platform.OS === 'android') {
            const sonuc = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ]);

            if (!(sonuc[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED && sonuc[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED))
                return { durum: 'izinYok' };
        }
        else {
            const sonuc = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

            if (sonuc !== RESULTS.GRANTED)
                return { durum: 'izinYok' };
        }

        return await new Promise<KonumSonucu>(resolve => {
            Geolocation.getCurrentPosition(
                position => resolve({
                    durum: 'tamam',
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    dogruluk: position.coords.accuracy,
                }),
                () => resolve({ durum: 'alinamadi' }),
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
            );
        });
    } catch {
        return { durum: 'alinamadi' };
    }
};
