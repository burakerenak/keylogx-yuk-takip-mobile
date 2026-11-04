import { api } from './client';
import { ApiResponse } from '../types/api.types';
import { GetMyProfileResponse, LoginRequest, LoginResponse, UpdateFirebaseTokenRequest, UpdateFirebaseTokenResponse } from '../types/user.types';

export const login = async (
    body: LoginRequest
): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<LoginResponse>>('/User/Login', body);

    return res.data.data; // 👈 burada type-safe
};

/**
 * Bildirim adresi (FCM token) kaydi. #541: sunucu ayni adresi baska kullanicilardan siler; { token: '' } cagiranin adresini siler.
 * sessiz: hata olursa uyari penceresi gosterilmez (arka planda yapilan kayit / silme).
 */
export const updateFirebaseToken = async (
    body: UpdateFirebaseTokenRequest,
    sessiz = false
): Promise<UpdateFirebaseTokenResponse> => {
    const res = await api.post<ApiResponse<UpdateFirebaseTokenResponse>>('/User/UpdateFirebaseToken', body, { sessiz });

    return res.data.data; // 👈 burada type-safe
};
/** 4.3 Profilim: oturumdaki kullanicinin tanim bilgileri. */
export const getMyProfile = async (): Promise<GetMyProfileResponse> => {
    const res = await api.post<ApiResponse<GetMyProfileResponse>>('/User/GetMyProfile', {});

    return res.data.data;
};

/** 4.3 Sifre degistir: basarida sunucu kullanicinin tum oturumlarini dusurur. */
export const changeMyPassword = async (body: { currentPassword: string, newPassword: string }): Promise<string> => {
    const res = await api.post<ApiResponse<boolean>>('/User/ChangeMyPassword', body);

    return res.data.message ?? 'Şifreniz değiştirildi.';
};
