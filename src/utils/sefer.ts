import { EtiketTonu } from '../ui';
import { getDistanceKm } from './commonUtils';

/** Sefer kartlari icin ortak hesaplar (4.3, 09.10.2026). */

export type SeferDurumu = 'Başlatılmadı' | 'Yolda' | 'Tamamlandı';

interface SeferBenzeri {
    startDate?: string | null
    endDate?: string | null
    vehicleName?: string | null
    trailerName?: string | null
}

interface YukBenzeri {
    loadingFirmCustomerName?: string | null
    deliverFirmCustomerName?: string | null
    loadingFirmCustomerAddressLat?: number | null
    loadingFirmCustomerAddressLon?: number | null
    deliverFirmCustomerAddressLat?: number | null
    deliverFirmCustomerAddressLon?: number | null
    ambarVoyageOrder?: number
}

export const seferDurumu = (s: SeferBenzeri): SeferDurumu => s.endDate ? 'Tamamlandı' : s.startDate ? 'Yolda' : 'Başlatılmadı';

export const durumTonu = (d: SeferDurumu): EtiketTonu => d === 'Tamamlandı' ? 'yesil' : d === 'Yolda' ? 'mavi' : 'amber';

/** Plaka - Dorse; dorse yoksa yalniz plaka. */
export const plakaMetni = (s: SeferBenzeri) => [s.vehicleName, s.trailerName].filter(x => x && String(x).trim()).join(' - ');

/** Ilk yukun yukleme firmasi -> son yukun teslim firmasi. */
export const rota = (yukler: YukBenzeri[]) => {
    const sirali = [...yukler].sort((a, b) => (a.ambarVoyageOrder ?? 0) - (b.ambarVoyageOrder ?? 0));

    return {
        nereden: sirali[0]?.loadingFirmCustomerName ?? '',
        nereye: sirali[sirali.length - 1]?.deliverFirmCustomerName ?? '',
    };
};

/** Yuklerin yukleme -> teslim mesafelerinin toplami (koordinati eksik yuk sayilmaz). */
export const toplamKm = (yukler: YukBenzeri[]) => yukler
    .filter(x => x.loadingFirmCustomerAddressLat && x.loadingFirmCustomerAddressLon && x.deliverFirmCustomerAddressLat && x.deliverFirmCustomerAddressLon)
    .reduce((t, x) => t + getDistanceKm(x.deliverFirmCustomerAddressLat ?? 0, x.deliverFirmCustomerAddressLon ?? 0, x.loadingFirmCustomerAddressLat ?? 0, x.loadingFirmCustomerAddressLon ?? 0), 0);

export const kmMetni = (km: number) => `${km.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`;

/** Son 7 gunde bitti mi (tarih okunamazsa hayir). */
export const buHaftaBitti = (endDate?: string | null) => {
    if (!endDate)
        return false;

    const t = new Date(endDate).getTime();

    return !isNaN(t) && Date.now() - t <= 7 * 24 * 60 * 60 * 1000;
};
