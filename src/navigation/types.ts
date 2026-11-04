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
    MesaiPlanlama: { sekme?: 'onay' } | undefined,
    /** 4.6: Mesai Planlama > Yeni Talep. */
    /** mesaiTalebiId: revizedeki talebi duzeltme. */
    MesaiTalebiYeni: { mesaiTalebiId?: string } | undefined,
    /** Ek mesai daveti: Kaliyorum / Kalamiyorum (bildirimden talep kimligiyle acilir). */
    EkMesaiDavet: { mesaiTalebiId?: string } | undefined,
    /** Davetleri yonet: durumlar, yerine kisi secimi (ret / yanit yok bildiriminden acilir). */
    EkMesaiDavetYonetim: { mesaiTalebiId: string },
    /** IK Faz 3: Vardiyam ve izinlerim (14 gun vardiya, yillik izin bakiyesi, isteklerim). */
    Vardiyam: undefined,
    /** IK Faz 3: Izin Iste formu. */
    IzinIste: undefined,
    /** IK Faz 3: Gun Degisimi Iste formu. */
    GunDegisimiIste: undefined,
    /** IK Faz 3: onaylayicinin bekleyen izin ve gun degisimi istekleri. */
    IzinOnaylari: undefined,
    /** 4.4: Profilim > Mesai Gecmisim (son 12 ay). */
    MesaiGecmisi: undefined,
    /** 4.4: Mesai Gecmisim > ay detayi (gun gun kayitlar). */
    MesaiGecmisiGun: {
        yil: number
        ay: number
        donemAdi: string
    },
    ChangePassword: undefined,
    /** #542: eksik izinler (konum, konum servisi, bildirim, kamera); oturum acilinca eksik varsa kendiliginden acilir. */
    Izinler: undefined,
    UpdateProduct: {
        ambar: GetAmbarByIdResponse
        ambarProduct: GetAmbarByIdResponseAmbarProduct
    }
};
