import { api } from './client';
import { ApiResponse } from '../types/api.types';
import {
    BekleyenIsteklerResponse,
    IstekKararRequest,
    IzinIsteRequest,
    IzinItem,
    TakasIsteRequest,
    TakasItem,
    VardiyamResponse,
} from '../types/istek.types';

/**
 * IK Faz 3 (03.11.2026): Vardiyam ve izinlerim, izin / gun degisimi istegi, onaylayicinin kararlari.
 * Hata mesajini (isSuccess=false) baglanti katmani gosterir ve istek reddedilir.
 */

/** Bugunden 14 gunluk vardiya, yillik izin bakiyesi, isteklerim, form secenekleri ve onaylayicilar. */
export const getVardiyam = async (): Promise<VardiyamResponse> => {
    const res = await api.post<ApiResponse<VardiyamResponse>>('/Istek/Vardiyam', {});

    return res.data.data;
};

export const izinIste = async (body: IzinIsteRequest): Promise<IzinItem> => {
    const res = await api.post<ApiResponse<IzinItem>>('/Istek/IzinIste', body);

    return res.data.data;
};

export const izinIptal = async (id: string): Promise<void> => {
    await api.post<ApiResponse<boolean>>('/Istek/IzinIptal', { id });
};

export const takasIste = async (body: TakasIsteRequest): Promise<TakasItem> => {
    const res = await api.post<ApiResponse<TakasItem>>('/Istek/TakasIste', body);

    return res.data.data;
};

export const takasIptal = async (id: string): Promise<void> => {
    await api.post<ApiResponse<boolean>>('/Istek/TakasIptal', { id });
};

/** Onaylayicinin karar verebilecegi bekleyen istekler. */
export const getBekleyenIstekler = async (): Promise<BekleyenIsteklerResponse> => {
    const res = await api.post<ApiResponse<BekleyenIsteklerResponse>>('/Istek/Bekleyenler', {});

    return res.data.data;
};

export const izinKarar = async (body: IstekKararRequest): Promise<IzinItem> => {
    const res = await api.post<ApiResponse<IzinItem>>('/Istek/IzinKarar', body);

    return res.data.data;
};

export const takasKarar = async (body: IstekKararRequest): Promise<TakasItem> => {
    const res = await api.post<ApiResponse<TakasItem>>('/Istek/TakasKarar', body);

    return res.data.data;
};
