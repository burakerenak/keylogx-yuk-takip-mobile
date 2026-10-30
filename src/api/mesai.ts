import { api } from './client';
import { ApiResponse } from '../types/api.types';
import {
    MesaiDavetItem,
    MesaiDavetYanitRequest,
    MesaiDurumResponse,
    MesaiGecmisimRequest,
    MesaiGecmisimResponse,
    MesaiOkutRequest,
    MesaiOkutResponse,
    MesaiTalebiDavetGuncelleRequest,
    MesaiTalebiItem,
    MesaiTalebiKaydetRequest,
    MesaiTalebiKisiDegistirRequest,
    MesaiTalebiListeRequest,
    MesaiTalebiSecenekler,
} from '../types/mesai.types';

/**
 * 4.4 Ana sayfa Mesai karti: acik kayit + bugunku calisma saati (4.6: + gorev yetkisinden kartlar).
 * Sessiz: her odaklanmada yenilenir; hata olursa kart varsayilan metne duser, uyari penceresi acilmaz.
 */
export const getMesaiDurum = async (): Promise<MesaiDurumResponse> => {
    const res = await api.post<ApiResponse<MesaiDurumResponse>>('/Mesai/Durum', {}, { sessiz: true });

    return res.data.data;
};

/**
 * 4.4 QR okutma. Saat sunucudan alinir. isSuccess=false (gecersiz QR, uzak konum, yetki yok...) baglanti katmaninda
 * uyari olarak gosterilir ve istek reddedilir. 4.6: GIRIS / CIKIS / DEGISTI; IS_TIPI_GEREKLI yalniz eski sunucuda.
 */
export const okut = async (body: MesaiOkutRequest): Promise<MesaiOkutResponse> => {
    const res = await api.post<ApiResponse<MesaiOkutResponse>>('/Mesai/Okut', body);

    return res.data.data;
};

/**
 * 4.4 Profilim > Mesai Gecmisim: oturumdaki kullanicinin kendi kayitlari (personel ve/veya surucu).
 * Govdesiz -> son 12 ay (yeniden eskiye, yalniz kaydi olan aylar); yil+ay -> o ayin gunleri (yeniden eskiye).
 * 4.6: ayda alacak + donem durumu, kayitta kisinin kendi ucreti.
 */
export const getMesaiGecmisim = async (body: MesaiGecmisimRequest = {}): Promise<MesaiGecmisimResponse> => {
    const res = await api.post<ApiResponse<MesaiGecmisimResponse>>('/Mesai/Gecmisim', body);

    return res.data.data;
};

// ---------------------------------------------------------------- 4.6 Ek Mesai Talepleri (Mesai Planlama)

/** Yeni Talep formunun secenekleri: depolar, Musteri · Bolum · PO satirlari, saat araliklari, personeller. */
export const getMesaiTalebiSecenekler = async (): Promise<MesaiTalebiSecenekler> => {
    const res = await api.post<ApiResponse<MesaiTalebiSecenekler>>('/MesaiTalebi/Secenekler', {});

    return res.data.data;
};

/**
 * Talep listesi. durum PLAN = bugun ve sonrasi, TAMAM = gunu gecmis (yeniden eskiye).
 * sessiz: ana sayfadaki Mesai Planlama ozeti hata olursa uyari acmasin.
 */
export const getMesaiTalebiListe = async (body: MesaiTalebiListeRequest, sessiz?: boolean): Promise<MesaiTalebiItem[]> => {
    const res = await api.post<ApiResponse<MesaiTalebiItem[]>>('/MesaiTalebi/Liste', body, { sessiz });

    return res.data.data ?? [];
};

export const kaydetMesaiTalebi = async (body: MesaiTalebiKaydetRequest): Promise<MesaiTalebiItem> => {
    const res = await api.post<ApiResponse<MesaiTalebiItem>>('/MesaiTalebi/Kaydet', body);

    return res.data.data;
};

/** Mesai Planlama > kisi -/+ (en az 1). */
export const kisiDegistirMesaiTalebi = async (body: MesaiTalebiKisiDegistirRequest): Promise<MesaiTalebiItem> => {
    const res = await api.post<ApiResponse<MesaiTalebiItem>>('/MesaiTalebi/KisiDegistir', body);

    return res.data.data;
};

/** Ek mesai daveti: oturumdaki personelin davetleri. Ana sayfa karti sessiz ister. */
export const getDavetlerim = async (sessiz?: boolean): Promise<MesaiDavetItem[]> => {
    const res = await api.post<ApiResponse<MesaiDavetItem[]>>('/MesaiTalebi/Davetlerim', {}, { sessiz });

    return res.data.data ?? [];
};

/** Kaliyorum / Kalamiyorum; guncel davet listesini doner. */
export const davetYanit = async (body: MesaiDavetYanitRequest): Promise<MesaiDavetItem[]> => {
    const res = await api.post<ApiResponse<MesaiDavetItem[]>>('/MesaiTalebi/DavetYanit', body);

    return res.data.data ?? [];
};

/** Davetleri yonet: kisi ekle / cikar, kisi sayisi. */
export const davetGuncelleMesaiTalebi = async (body: MesaiTalebiDavetGuncelleRequest): Promise<MesaiTalebiItem> => {
    const res = await api.post<ApiResponse<MesaiTalebiItem>>('/MesaiTalebi/DavetGuncelle', body);

    return res.data.data;
};

export const silMesaiTalebi = async (ids: string[]): Promise<void> => {
    await api.post<ApiResponse<unknown>>('/MesaiTalebi/Sil', { ids });
};
