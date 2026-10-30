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
    /** 4.4: QR ile mesai giris / cikis (kamera -> sonuc; 4.6'da is tipi yalniz eski sunucu sorarsa). */
    MesaiQr: undefined,
    /** 4.6: Mesai Planlama (Ek Mesai Talepleri): Planlananlar / Tamamlananlar. */
    MesaiPlanlama: undefined,
    /** 4.6: Mesai Planlama > Yeni Talep. */
    MesaiTalebiYeni: undefined,
    /** Ek mesai daveti: Kaliyorum / Kalamiyorum (bildirimden talep kimligiyle acilir). */
    EkMesaiDavet: { mesaiTalebiId?: string } | undefined,
    /** Davetleri yonet: durumlar, yerine kisi secimi (ret / yanit yok bildiriminden acilir). */
    EkMesaiDavetYonetim: { mesaiTalebiId: string },
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
