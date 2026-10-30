import { navigationRef } from '../navigation/navigationRef';
import { useAuthStore } from '../store/authStore';
import { BildirimHedefi, bildirimHedefi } from '../utils/mesaiDavet';

/**
 * Bildirime tiklaninca ekran acma (30.10.2026, #515). Uygulama kapaliyken oturum ve gezinti hazir olmadan gelir:
 * hedef bekletilir, ana sayfa acilinca bekleyeniAc ile gidilir.
 */
let bekleyen: BildirimHedefi | undefined;

export const bekleyeniAc = () => {
    if (!bekleyen || !navigationRef.isReady() || !useAuthStore.getState().user)
        return;

    const h = bekleyen;
    bekleyen = undefined;
    navigationRef.navigate(h.ekran as any, h.parametre as any);
};

export const bildirimAc = (veri: Record<string, unknown> | undefined | null) => {
    const h = bildirimHedefi(veri);

    if (!h)
        return;

    bekleyen = h;
    bekleyeniAc();
};
