/**
 * 4.4 QR mesai (Faz 1b sozlesmesi, 11.10.2026). Mobil yanitlarda fiyat / ucret YOKTUR.
 */

/** 1 Personel (depo QR'i, KXQR:N), 2 Surucu (arac QR'i, KXQR:A). */
export type MesaiTuru = 1 | 2;

/** 1 Lojistik, 2 Ambalaj (yalniz personel girisinde). */
export type IsTipi = 1 | 2;

/** 1 Acik, 2 Tamam, 3 Eksik cikis. */
export type MesaiKaydiDurum = 1 | 2 | 3;

export interface MesaiKaydiOzet {
    mesaiKaydiId: string
    tur: MesaiTuru
    /** Personelde nokta adi, surucude plaka. */
    noktaAdi: string
    isTipi: IsTipi | null
    isTipiAdi: string | null
    /** "yyyy-MM-dd" (giris gunu). */
    tarih: string
    /** "HH:mm" (sunucu saati). */
    girisSaati: string
    cikisSaati: string | null
    normalDk: number
    ekDk: number
    sureDk: number
    durum: MesaiKaydiDurum
    durumAdi: string
}

export interface MesaiDurumu {
    acikKayit: MesaiKaydiOzet | null
    kisiAdi: string
}

export interface BugunCalismaSaati {
    calisir: boolean
    /** "HH:mm" */
    baslangic: string | null
    bitis: string | null
}

export interface MesaiDurumResponse {
    /** Kullanici personele bagliysa dolu. */
    personel: MesaiDurumu | null
    /** Kullanici surucuye bagliysa dolu. */
    surucu: MesaiDurumu | null
    bugunCalismaSaati: BugunCalismaSaati | null
}

export interface MesaiOkutRequest {
    qrMetni: string
    lat: number | null
    lon: number | null
    isTipi: IsTipi | null
}

export type MesaiOkutResponse =
    | { islem: 'IS_TIPI_GEREKLI', noktaAdi: string }
    | { islem: 'GIRIS' | 'CIKIS', kayit: MesaiKaydiOzet, kapatilanDepoKaydi: MesaiKaydiOzet | null };
