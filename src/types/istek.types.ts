/**
 * IK Faz 3 (03.11.2026): personelin kendi vardiyasi, izin ve gun degisimi istekleri, onaylayicinin bekleyenleri.
 * Sunucu: IstekController (Istek/*). Alan adlari sunucu yanitlariyla ayni (camelCase).
 */

/** 1 Onayli, 2 Onay bekliyor, 3 Reddedildi, 4 Iptal edildi. */
export type IstekDurumu = 1 | 2 | 3 | 4;

export interface IzinTuruItem {
    izinTuruId: string
    kod: string
    ad: string
    ucretli: boolean
    yillikIzindenDuser: boolean
    yasalGun: number | null
    aktif: boolean
}

export interface VardiyaTanimiItem {
    vardiyaTanimiId: string
    kod: string
    ad: string
    baslangic: string
    bitis: string
    aktif: boolean
}

export interface IzinItem {
    izinId: string
    personnelId: string
    personelAdi: string | null
    izinTuruId: string
    kod: string
    turAdi: string
    ucretli: boolean
    /** "yyyy-MM-dd" */
    baslangic: string
    bitis: string
    /** "dd.MM.yyyy" */
    baslangicStr: string
    bitisStr: string
    gunSayisi: number
    aciklama: string | null
    giren: string | null
    tarih: string
    durum: IstekDurumu
    durumAdi: string
    kararVeren: string | null
    kararZamani: string | null
    redNedeni: string | null
    /** Yillik izinden dusen gun (hafta tatili ve resmi tatil haric). */
    dusenGun: number | null
    kararVerebilir: boolean
}

export interface TakasItem {
    takasId: string
    personnelId: string
    personelAdi: string | null
    tarih: string
    tarihStr: string
    mevcutKod: string | null
    mevcutSaat: string | null
    /** Istenen vardiya kodu, "HT" hafta tatili. */
    istenenKod: string
    istenenSaat: string | null
    karsiPersonnelId: string | null
    karsiPersonelAdi: string | null
    karsiMevcutKod: string | null
    aciklama: string | null
    durum: IstekDurumu
    durumAdi: string
    kararVeren: string | null
    kararZamani: string | null
    redNedeni: string | null
    olusturmaZamani: string
    kararVerebilir: boolean
}

export interface IzinBakiyeItem {
    personnelId: string
    personelAdi: string | null
    iseGirisTarihi: string | null
    kidemYil: number
    yillikHak: number
    hakEdilen: number
    devreden: number
    kullanilan: number
    bekleyen: number
    kalan: number
    sonrakiHakTarihi: string | null
    uyari: string | null
}

export interface VardiyamGunu {
    tarih: string
    gunAdi: string
    kod: string | null
    ad: string | null
    saat: string | null
    tatil: boolean
    degisiklik: boolean
    izinKodu: string | null
    izinAdi: string | null
    ozelGun: string | null
}

export interface IstekKisi {
    personnelId: string
    ad: string | null
}

export interface VardiyamResponse {
    personelAdi: string | null
    gunler: VardiyamGunu[]
    bakiye: IzinBakiyeItem | null
    izinler: IzinItem[]
    takaslar: TakasItem[]
    izinTurleri: IzinTuruItem[]
    vardiyalar: VardiyaTanimiItem[]
    takasPersonelleri: IstekKisi[]
    onaylayicilar: string[]
}

export interface BekleyenIsteklerResponse {
    izinler: IzinItem[]
    takaslar: TakasItem[]
}

export interface IzinIsteRequest {
    izinTuruId: string
    baslangic: string
    bitis: string
    aciklama?: string
}

export interface TakasIsteRequest {
    tarih: string
    istenenVardiyaTanimiId?: string
    tatil?: boolean
    karsiPersonnelId?: string
    aciklama?: string
}

export interface IstekKararRequest {
    id: string
    onay: boolean
    redNedeni?: string
}
