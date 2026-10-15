import { GetAmbarByIdResponse, GetAmbarByIdResponseAmbarProduct } from "../types/ambar.types";

export type AppStackParamList = {
    /** 4.3: Ana sayfa (Mesai Baslangici + Gorevlerim). */
    Home: undefined;
    /** 4.3: Gorevlerim = sefer listesi (eski ana ekran). */
    Tasks: undefined;
    Detail: {
        ambarId: string
    },
    /** Sefer > Guzergah Goster: teslim sirasi + gercek yol cizgisi (yalniz gosterim). refNo baslikta gorunur. */
    Map: {
        ambarVoyageId: string
        refNo?: string
    },
    Order: {
        ambarVoyageId: string
    },
    Profile: undefined,
    /** 4.4: QR ile mesai giris / cikis (kamera -> is tipi -> sonuc). */
    MesaiQr: undefined,
    /** 4.4: Profilim > Mesai Gecmisim (son 12 ay). */
    MesaiGecmisi: undefined,
    /** 4.4: Mesai Gecmisim > ay detayi (gun gun kayitlar). */
    MesaiGecmisiGun: {
        yil: number
        ay: number
        donemAdi: string
    },
    ChangePassword: undefined,
    UpdateProduct: {
        ambar: GetAmbarByIdResponse
        ambarProduct: GetAmbarByIdResponseAmbarProduct
    }
};
