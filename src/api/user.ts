import { api } from './client';
import { ApiResponse } from '../types/api.types';
import { LoginRequest, LoginResponse, UpdateFirebaseTokenRequest, UpdateFirebaseTokenResponse } from '../types/user.types';

export const login = async (
    body: LoginRequest
): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<LoginResponse>>('/User/Login', body);

    return res.data.data; // 👈 burada type-safe
};

export const updateFirebaseToken = async (
    body: UpdateFirebaseTokenRequest
): Promise<UpdateFirebaseTokenResponse> => {
    const res = await api.post<ApiResponse<UpdateFirebaseTokenResponse>>('/User/UpdateFirebaseToken', body);

    return res.data.data; // 👈 burada type-safe
};