import { useAuthStore } from '../store/authStore';
import { LoginResponse } from '../types/user.types';

export type KullaniciTuru = {
    /** Kullanici bir surucu kaydina bagli (driverId dolu): Gorevlerim / sefer ekranlari gorunur. */
    surucu: boolean
    /** Kullanici bir personel kaydina bagli (personnelId dolu): depo QR'i ile mesai okutur. */
    personel: boolean
};

const turBul = (user: LoginResponse | null | undefined): KullaniciTuru => ({
    surucu: !!user?.driverId,
    personel: !!user?.personnelId,
});

/**
 * 4.4 QR mesai: oturumdaki kullanicinin turu. Ayni kisi hem surucu hem personel olabilir;
 * yalniz personel olan kullanicida (driverId yok) Gorevlerim ve sefer menuleri gizlenir.
 */
export const kullaniciTuru = (): KullaniciTuru => turBul(useAuthStore.getState().user);

/** Bilesenler icin: oturum degisince yeniden cizilir. */
export const useKullaniciTuru = (): KullaniciTuru => {
    const user = useAuthStore((s) => s.user);

    return turBul(user);
};
