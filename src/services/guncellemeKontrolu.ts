import { Platform } from 'react-native';
import { API_URL } from '../config';
import { SURUM } from '../surum';
import { SurumKontrolYaniti, surumYanitiniAc } from '../utils/guncelleme';

/** Kontrol uygulamayi bekletmez: en cok bu kadar beklenir. */
const ZAMAN_ASIMI = 3000;

/**
 * Acilista guncelleme kontrolu (04.11.2026, #545): POST MobilSurum/Kontrol (girissiz).
 * Baglanti katmaninin (api/client.ts) otomatik hata pencereleri ve yukleniyor perdesi tetiklenmesin diye duz fetch.
 * Hata / zaman asimi / basarisiz yanit -> undefined (sessizce gecilir).
 */
export const surumKontrolEt = async (): Promise<SurumKontrolYaniti | undefined> => {
    const denetleyici = new AbortController();
    const zaman = setTimeout(() => denetleyici.abort(), ZAMAN_ASIMI);

    try {
        const yanit = await fetch(`${API_URL}/MobilSurum/Kontrol`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ platform: Platform.OS === 'ios' ? 'ios' : 'android', surum: SURUM }),
            signal: denetleyici.signal,
        });

        if (!yanit.ok)
            return undefined;

        return surumYanitiniAc(await yanit.json());
    } catch {
        return undefined;
    } finally {
        clearTimeout(zaman);
    }
};
