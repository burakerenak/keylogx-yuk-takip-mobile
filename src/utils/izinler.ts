/**
 * Izinler ekrani saf kurallari (04.11.2026, #542). Izin sonuclari react-native-permissions RESULTS degerleridir
 * (burada metin olarak; kutuphane yuklenmeden test edilebilsin).
 */

export type IzinSonucu = 'granted' | 'limited' | 'denied' | 'blocked' | 'unavailable';

export type IzinSatirAdi = 'konumIzni' | 'konumServisi' | 'bildirim' | 'kamera';

/** izinVer: sistem izin penceresi acilabilir; ayarlariAc: kalici reddedildi; konumuAc: telefonun konumu kapali. */
export type SatirDugmesi = 'izinVer' | 'ayarlariAc' | 'konumuAc';

export type IzinSatiri = { ad: IzinSatirAdi, tamam: boolean, dugme: SatirDugmesi | null };

export const IZIN_METINLERI: Record<IzinSatirAdi, { baslik: string, aciklama: string }> = {
    konumIzni: { baslik: 'Konum izni', aciklama: 'Mesai QR okutma ve yük teslimi için konumunuz gerekir.' },
    konumServisi: { baslik: 'Konum servisi', aciklama: 'Telefonunuzun konumu açık olmalıdır.' },
    bildirim: { baslik: 'Bildirim izni', aciklama: 'Mesai hatırlatmaları ve yük bildirimleri için gerekir.' },
    kamera: { baslik: 'Kamera izni', aciklama: 'Mesai QR kodunu okutmak ve teslim fotoğrafı çekmek için gerekir.' },
};

export const DUGME_METINLERI: Record<SatirDugmesi, string> = {
    izinVer: 'İzin ver',
    ayarlariAc: 'Ayarları aç',
    konumuAc: 'Konumu aç',
};

/**
 * Izin sonucu -> satir. granted / limited tamam; denied istenebilir; blocked ayarlardan acilir.
 * unavailable: ozellik cihazda yok (tamam sayilir, kullanicinin yapabilecegi bir sey yok). iOS konumda ise
 * unavailable "konum servisleri kapali" demektir: eksik + ayarlar (unavailableEksik).
 */
export const izinSatiri = (_ad: IzinSatirAdi, _sonuc: IzinSonucu, _unavailableEksik = false): IzinSatiri => {
    if (_sonuc === 'granted' || _sonuc === 'limited')
        return { ad: _ad, tamam: true, dugme: null };

    if (_sonuc === 'denied')
        return { ad: _ad, tamam: false, dugme: 'izinVer' };

    if (_sonuc === 'unavailable' && !_unavailableEksik)
        return { ad: _ad, tamam: true, dugme: null };

    return { ad: _ad, tamam: false, dugme: 'ayarlariAc' };
};

/** Android konum servisi: undefined (olculemedi) tamam sayilir. */
export const konumServisiSatiri = (_acik: boolean | undefined): IzinSatiri =>
    _acik === false
        ? { ad: 'konumServisi', tamam: false, dugme: 'konumuAc' }
        : { ad: 'konumServisi', tamam: true, dugme: null };

/**
 * Android hassas (FINE) + yaklasik (COARSE) konum: biri yeterli (anlikKonum ile ayni kural).
 * Ikisi de yoksa biri kalici reddedildiyse blocked, aksi halde denied.
 */
export const konumIzniBirlesik = (_sonuclar: IzinSonucu[]): IzinSonucu => {
    if (_sonuclar.some(x => x === 'granted'))
        return 'granted';

    if (_sonuclar.some(x => x === 'limited'))
        return 'limited';

    if (_sonuclar.some(x => x === 'blocked'))
        return 'blocked';

    if (_sonuclar.length && _sonuclar.every(x => x === 'unavailable'))
        return 'unavailable';

    return 'denied';
};

/**
 * Android'de check() kalici reddi gormez (hep denied doner); kalici red yalniz request() sonucunda blocked olarak gelir.
 * Son istek blocked dondurduyse ve olcum hala denied ise satir blocked sayilir.
 */
export const sonIstekleBirlestir = (_olculen: IzinSonucu, _sonIstek: IzinSonucu | undefined): IzinSonucu =>
    _olculen === 'denied' && _sonIstek === 'blocked' ? 'blocked' : _olculen;

export const eksikVarMi = (_satirlar: IzinSatiri[]) => _satirlar.some(x => !x.tamam);
