import { updateFirebaseToken } from '../api/user';
import { useAuthStore } from '../store/authStore';
import { oturumuKapatAkisi } from '../utils/oturum';
import { izinErtelemesiniSifirla } from './izinDenetimi';
import notificationService from './notificationService';
import { deleteUser } from './userService';

/**
 * Bildirim adresi yalniz giris yapmis kullaniciya (04.11.2026, #541).
 * Sunucu adresi kullanici kaydinda tutar; ayni telefonda ikinci kullanici girince ya da cikis yapilinca
 * eski kullaniciya bildirim gitmesin diye cikista adres silinir, her oturum acilisinda yeniden kaydedilir.
 */

/** Telefonun bildirim adresini oturumdaki kullaniciya kaydeder (sessiz; hata girisi / acilisi engellemez). */
export const bildirimAdresiniKaydet = async (_token?: string | null) => {
    try {
        const token = _token ?? await notificationService.getToken();

        if (token)
            await updateFirebaseToken({ token }, true);
    } catch {
        // Bildirim adresi kaydedilemezse uygulama yine de surer.
    }
};

/**
 * Cikis Yap ve sifre degisimi sonrasi cikis: once sunucudaki bildirim adresi silinir (en cok ~3 sn, sessiz),
 * sonra hatirlanan kullanici silinir ve oturum kapanir. 401'deki otomatik cikis (client.ts) bunu kullanmaz:
 * oturum anahtari zaten gecersizdir.
 */
export const oturumuKapat = () => oturumuKapatAkisi({
    adresiSil: () => updateFirebaseToken({ token: '' }, true),
    kullaniciyiSil: deleteUser,
    cikis: () => {
        izinErtelemesiniSifirla();
        useAuthStore.getState().signOut();
    },
});
