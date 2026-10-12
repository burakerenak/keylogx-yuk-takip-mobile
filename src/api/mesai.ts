import { api } from './client';
import { ApiResponse } from '../types/api.types';
import { MesaiDurumResponse, MesaiGecmisimRequest, MesaiGecmisimResponse, MesaiOkutRequest, MesaiOkutResponse } from '../types/mesai.types';

/**
 * 4.4 Ana sayfa Mesai karti: acik kayit + bugunku calisma saati.
 * Sessiz: her odaklanmada yenilenir; hata olursa kart varsayilan metne duser, uyari penceresi acilmaz.
 */
export const getMesaiDurum = async (): Promise<MesaiDurumResponse> => {
    const res = await api.post<ApiResponse<MesaiDurumResponse>>('/Mesai/Durum', {}, { sessiz: true });

    return res.data.data;
};

/**
 * 4.4 QR okutma. Saat sunucudan alinir. isSuccess=false (gecersiz QR, uzak konum...) baglanti katmaninda
 * uyari olarak gosterilir ve istek reddedilir. Personel girisinde isTipi yoksa islem "IS_TIPI_GEREKLI" doner.
 */
export const okut = async (body: MesaiOkutRequest): Promise<MesaiOkutResponse> => {
    const res = await api.post<ApiResponse<MesaiOkutResponse>>('/Mesai/Okut', body);

    return res.data.data;
};

/**
 * 4.4 Profilim > Mesai Gecmisim: oturumdaki kullanicinin kendi kayitlari (personel ve/veya surucu), fiyat yok.
 * Govdesiz -> son 12 ay (yeniden eskiye, yalniz kaydi olan aylar); yil+ay -> o ayin gunleri (yeniden eskiye).
 */
export const getMesaiGecmisim = async (body: MesaiGecmisimRequest = {}): Promise<MesaiGecmisimResponse> => {
    const res = await api.post<ApiResponse<MesaiGecmisimResponse>>('/Mesai/Gecmisim', body);

    return res.data.data;
};
