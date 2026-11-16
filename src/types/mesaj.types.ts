/** Firma ici mesajlasma (4.14, #615) — web MesajService ile ayni bicimler. */

export const BIREBIR = 1;
export const GRUP = 2;

export interface MesajKisi {
    userId: string
    ad: string
    surucu: boolean
    yonetici?: boolean
}

export interface KonusmaOzeti {
    id: string
    tur: number
    ad: string
    surucu: boolean
    karsiTarafId?: string | null
    sonMesaj?: string | null
    sonGonderen?: string | null
    sonMesajZamani?: string | null
    okunmamis: number
    yonetici: boolean
    sabitlemeZamani?: string | null
    uyeler: MesajKisi[]
}

export interface MesajSatiri {
    id: string
    konusmaId: string
    companyId: string
    gonderenId: string
    gonderenAdi: string
    metin?: string | null
    geriAlindi: boolean
    zaman: string
    okundu: boolean
    dosyaUrl?: string | null
    dosyaAdi?: string | null
    dosyaBoyutu?: number | null
    dosyaResim?: boolean
}
