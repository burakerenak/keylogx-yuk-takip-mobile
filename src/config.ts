/**
 * Sunucu adresi tek yerden secilir (4.4, 11.10.2026).
 *
 * TEST derlemesi nasil alinir:
 *   1. Asagidaki AKTIF_ORTAM degerini 'TEST' yapin (baska bir yere dokunmayin).
 *   2. Derleyin ve TEST cihazina kurun.
 *   3. Magaza / canli derlemeden ONCE degeri tekrar 'CANLI' yapin.
 *
 * TEST sunucusu duz HTTP'dir. Android icin yalniz bu IP'ye duz HTTP izni
 * android/app/src/main/res/xml/network_security_config.xml dosyasinda verilir;
 * iOS'ta Info.plist NSAllowsArbitraryLoads zaten acik. Canli adres HTTPS oldugu icin etkilenmez.
 */
const ADRESLER = {
    CANLI: 'https://keylogxapi.ebbedev.com.tr',
    TEST: 'http://149.0.252.220:60000',
} as const;

export type Ortam = keyof typeof ADRESLER;

export const AKTIF_ORTAM: Ortam = 'CANLI';

export const API_URL: string = ADRESLER[AKTIF_ORTAM];
