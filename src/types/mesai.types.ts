/**
 * 4.4 QR mesai (Faz 1b sozlesmesi, 11.10.2026).
 * 4.6 Faz 2 (18.10.2026): gorev yetkisine bagli kartlar, DEGISTI (yer / is degisti), alacak ve kayit ucreti,
 * Ek Mesai Talepleri (Mesai Planlama). Yeni alanlarin hepsi istege bagli: eski sunucu gondermezse eski davranis.
 */

/** 1 Personel (depo / ofis QR'i ya da personelin arac okutmasi), 2 Surucu (arac QR'i, KXQR:A). */
export type MesaiTuru = 1 | 2;

/** 1 Lojistik, 2 Ambalaj (yalniz depo kaydinda; Faz 2'de QR'dan gelir). */
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
    /** "yyyy-MM-ddTHH:mm:ss" (sunucu saati); canli mesai sayaci icin. */
    girisZamani: string
    /** "HH:mm" (sunucu saati). */
    girisSaati: string
    cikisSaati: string | null
    normalDk: number
    ekDk: number
    sureDk: number
    durum: MesaiKaydiDurum
    durumAdi: string
    /** 4.6: "Depo" / "Ofis" / "Araç" (eski sunucuda yok). */
    noktaTuru?: string | null
    /** 4.6: yalniz kisinin kendi kaydinda (Mesai/Gecmisim); ucret kaydi yoksa null. */
    personelUcret?: number | null
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

/** 4.6: Durum.kartlar degerleri. Bilinmeyen deger gelirse yok sayilir. */
export type MobilKart = 'Gorevlerim' | 'MesaiPlanlama';

export interface MesaiDurumResponse {
    /** Kullanici personele bagliysa dolu. */
    personel: MesaiDurumu | null
    /** Kullanici surucuye bagliysa dolu. */
    surucu: MesaiDurumu | null
    bugunCalismaSaati: BugunCalismaSaati | null
    /** "yyyy-MM-ddTHH:mm:ss": yanit anindaki sunucu saati; sayac telefon saatinden bagimsiz olsun diye fark hesaplanir. */
    sunucuZamani: string
    /**
     * 4.6: gorev yetkisinden gelen mobil kartlar ("Gorevlerim", "MesaiPlanlama"); mesai acik olsun olmasin doner,
     * gosterme karari mobilde (yalniz acik kayit varken). Eski sunucuda alan yoktur (undefined).
     */
    kartlar?: string[] | null
}

export interface MesaiOkutRequest {
    qrMetni: string
    lat: number | null
    lon: number | null
    /** Faz 2 sunucusu yok sayar (is tipi QR'dan gelir); eski sunucunun IS_TIPI_GEREKLI akisi icin kalir. */
    isTipi: IsTipi | null
    /** Konum dogrulugu (metre); konum alinamadiysa null. */
    dogruluk?: number | null
    /** Telefondaki konum durumu: alindi / izin yok / alinamadi. */
    konumDurumu?: 'tamam' | 'izinYok' | 'alinamadi' | null
}

/**
 * GIRIS / DEGISTI: kayit = acilan kayit; CIKIS: kayit = kapanan kayit.
 * 4.6 DEGISTI: farkli QR okutuldu, onceki kayit o saatte kapandi (kapatilanKayit), yenisi acildi.
 * IS_TIPI_GEREKLI yalniz eski sunucuda doner (Faz 2'de is tipi QR'dan gelir).
 */
export type MesaiOkutResponse =
    | { islem: 'IS_TIPI_GEREKLI', noktaAdi: string }
    | {
        islem: 'GIRIS' | 'CIKIS' | 'DEGISTI'
        kayit: MesaiKaydiOzet
        /** 4.6: DEGISTI'de kapanan kayit. */
        kapatilanKayit?: MesaiKaydiOzet | null
        /** Eski alan (Faz 1b): arac QR'i acik depo kaydini kapattiysa; Faz 2'de kapatilanKayit ile ayni deger. */
        kapatilanDepoKaydi?: MesaiKaydiOzet | null
    };

/** Mesai/Gecmisim: govdesiz -> son 12 ay ozeti; yil+ay -> o ayin gunleri. */
export interface MesaiGecmisimRequest {
    yil?: number
    ay?: number
}

export interface MesaiGecmisAy {
    yil: number
    ay: number
    /** "ekim 2026" */
    donemAdi: string
    gunSayisi: number
    sureDk: number
    normalDk: number
    ekDk: number
    eksikCikis: number
    /** 4.6: o ayin ek mesai alacagi (TL; kisinin kendi personel kayitlarinin ucret toplami). Eski sunucuda yok. */
    alacak?: number | null
    /** 4.6: "Açık" (odeme fazinda "Kapandı"). */
    donemDurumu?: string | null
}

export interface MesaiGecmisGun {
    /** "yyyy-MM-dd" */
    tarih: string
    /** "pazartesi" */
    gunAdi: string
    sureDk: number
    normalDk: number
    ekDk: number
    kayitlar: MesaiKaydiOzet[]
}

export interface MesaiGecmisimResponse {
    aylar: MesaiGecmisAy[]
    gunler: MesaiGecmisGun[]
}

// ---------------------------------------------------------------- 4.6 Ek Mesai Talepleri (Mesai Planlama)

export interface MesaiTalebiDepo {
    mesaiNoktasiId: string
    ad: string
    /** Depo musteri / bolum eslesmesi (#508); bos = butun musteriler. bolumIdleri bos = musterinin butun bolumleri. */
    musteriler?: { musteriId: string, bolumIdleri: string[] }[]
}

/** Musteri · Bolum · PO · PO No satiri (CompanyPo). */
export interface MesaiPoSatiri {
    customerId: string
    customerName: string
    divisionId?: string | null
    divisionName: string | null
    poName: string | null
    poNo: string | null
    companyPoId: string
    etiket: string
}

export interface MesaiTalebiPersonel {
    personnelId: string
    ad: string
}

export interface MesaiTalebiSecenekler {
    depolar: MesaiTalebiDepo[]
    poSatirlari: MesaiPoSatiri[]
    /** ["08:00-18:00", ...] isletmenin talep saat araliklari. */
    araliklar: string[]
    /** Depo yetkili gorevlerdeki personel (isimle ayirma icin). */
    personeller: MesaiTalebiPersonel[]
    /** Kullanici tek depoda yetkiliyse o depo (#508). */
    varsayilanDepoId?: string | null
    /** Kullanicinin depo yetkisi var mi (varsa depolar yalniz yetkili oldugu depolar). */
    depoYetkisiVar?: boolean
}

/** PLAN = tarih >= bugun, TAMAM = tarih < bugun (yeniden eskiye). */
export type MesaiTalebiDurumu = 'PLAN' | 'TAMAM';

export interface MesaiTalebiListeRequest {
    /** "yyyy-MM-dd" */
    baslangic?: string
    bitis?: string
    durum?: MesaiTalebiDurumu
}

export interface MesaiTalebiAyrilan {
    personnelId: string
    ad: string
    geldi: boolean
    /** Ek mesai daveti: 1 Bekliyor, 2 Kaliyor, 3 Kalamiyor; bos ise davetsiz eski satir. */
    davetDurumu?: number | null
    davetZamani?: string | null
    yanitZamani?: string | null
    /** "12 dk", "1 sa 5 dk" */
    yanitSuresi?: string | null
    redNotu?: string | null
    telefonVar?: boolean
}

/** Personelin davet ekrani (MesaiTalebi/Davetlerim). */
export interface MesaiDavetItem {
    mesaiTalebiId: string
    tarihStr: string
    aralik: string
    depoAdi: string | null
    aciklama: string | null
    davetDurumu: number
    davetZamani: string | null
    yanitZamani: string | null
    redNotu: string | null
    /** Kalamiyorum'a gecilebilir mi. */
    degistirilebilir: boolean
}

export interface MesaiDavetYanitRequest {
    mesaiTalebiId: string
    kaliyor: boolean
    not?: string
}

export interface MesaiTalebiDavetGuncelleRequest {
    mesaiTalebiId: string
    kisiSayisi: number
    eklenecekPersonelIdleri: string[]
    cikarilacakPersonelIdleri: string[]
}

export interface MesaiTalebiYerlesen {
    mesaiKaydiId: string
    personnelId: string
    ad: string
    faturaAraligi: string
    faturaDk: number
}

export interface MesaiTalebiItem {
    mesaiTalebiId: string
    /** "yyyy-MM-dd" */
    tarih: string
    /** "dd.MM.yyyy" */
    tarihStr: string
    mesaiNoktasiId: string
    depoAdi: string
    companyPoId: string
    poEtiketi: string
    customerName: string
    divisionName: string | null
    poName: string | null
    poNo: string | null
    kisiSayisi: number
    /** "HH:mm" */
    baslangic: string
    bitis: string
    /** "18:00–22:00" */
    aralik: string
    ayrilanlar: MesaiTalebiAyrilan[] | null
    /** Daveti reddedenler: yer tutmaz, yeniden secilemez. */
    reddedenler?: MesaiTalebiAyrilan[] | null
    /** Talepte davet gitmis kisi var: kisi artirmak icin personel secilir. */
    davetModu?: boolean
    yerlesenler: MesaiTalebiYerlesen[] | null
    yerlesenSayisi: number
    eksik: number
    siparis: { ambarId: string, refNo: string } | null
    /** KDV haric toplam. */
    tutar: number
    faturali: boolean
    tamamlandi: boolean
    giren: string
    createdDate: string
}

export interface MesaiTalebiKaydetRequest {
    mesaiTalebiId?: string | null
    /** "yyyy-MM-dd" */
    tarih: string
    mesaiNoktasiId: string
    companyPoId: string
    kisiSayisi: number
    /** "HH:mm" */
    baslangic: string
    bitis: string
    ayrilanPersonelIdleri: string[]
    aciklama?: string | null
}

export interface MesaiTalebiKisiDegistirRequest {
    mesaiTalebiId: string
    kisiSayisi: number
}
