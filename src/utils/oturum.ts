/**
 * Oturum kapatma sirasi (04.11.2026, #541) saf hali: test edilebilsin diye adimlar disaridan verilir.
 */

/** Islem sure icinde bitmezse ya da hata verirse sessizce gecer (sonuc beklenmez). */
export const zamanAsimiyla = (_islem: () => Promise<unknown>, _ms: number) =>
    new Promise<void>(resolve => {
        const zaman = setTimeout(() => resolve(), _ms);
        let surec: Promise<unknown>;

        try {
            surec = _islem();
        } catch {
            surec = Promise.resolve();
        }

        surec.then(() => undefined, () => undefined).then(() => {
            clearTimeout(zaman);
            resolve();
        });
    });

export type OturumKapatmaAdimlari = {
    /** Sunucudaki bildirim adresini (FCM token) sil: { token: '' }. */
    adresiSil: () => Promise<unknown>
    /** Telefonun guvenli deposundaki hatirlanan kullaniciyi sil. */
    kullaniciyiSil: () => Promise<unknown>
    /** Bellekteki oturumu kapat (giris ekranina doner). */
    cikis: () => void
};

/** Bildirim adresi silmeyi en cok bu kadar bekle. */
export const ADRES_SILME_SURESI = 3000;

/**
 * Sira: once bildirim adresi silinir (oturum anahtari hala gecerliyken; en cok ~3 sn, hata yutulur),
 * sonra hatirlanan kullanici silinir, en son oturum kapanir. Depo silme hatasi da cikisi engellemez.
 */
export const oturumuKapatAkisi = async (_adimlar: OturumKapatmaAdimlari, _sure = ADRES_SILME_SURESI) => {
    await zamanAsimiyla(_adimlar.adresiSil, _sure);

    try {
        await _adimlar.kullaniciyiSil();
    } catch {
        // Depo silinemese de oturum kapanir.
    }

    _adimlar.cikis();
};
