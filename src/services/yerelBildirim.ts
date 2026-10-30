import { NativeModules, Platform } from 'react-native';

/**
 * Uygulama acikken gelen bildirimi sesli gosterir (30.10.2026, #505).
 * Android: telefonun bildirim alanina "Mesai Hatırlatma" kanaliyla sesli bildirim (yerel modul YerelBildirim).
 * iOS: on plan sunumu firebase.json'daki messaging_ios_foreground_presentation_options ile sistemce yapilir.
 */
export const yerelBildirimGoster = (baslik: string, metin: string) => {
    if (Platform.OS !== 'android')
        return;
    try {
        NativeModules.YerelBildirim?.goster(baslik, metin);
    } catch {
        // Modul yoksa (eski derleme) yazili bildirim yeterli.
    }
};
