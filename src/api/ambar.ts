import { api } from './client';
import { ApiResponse } from '../types/api.types';
import { AmbarSetDeliveryDateRequest, AmbarSetDeliveryDateResponse, AmbarSetDeliveryEndDateRequest, AmbarSetDeliveryEndDateResponse, AmbarSetLoadDateRequest, AmbarSetLoadDateResponse, AmbarSetLoadEndDateRequest, AmbarSetLoadEndDateResponse, GetAmbarByIdRequest, GetAmbarByIdResponse, GetAmbarListRequest, GetAmbarListResponse, UpdateAmbarProductRequest, UpdateAmbarProductResponse } from '../types/ambar.types';
import { Alert } from 'react-native';

export const getAmbarList = async (
    body: GetAmbarListRequest
): Promise<GetAmbarListResponse> => {
    const res = await api.post<ApiResponse<GetAmbarListResponse>>('/Ambar/GetAmbarList', body);

    return res.data.data; // 👈 burada type-safe
};

export const getAmbarById = async (
    body: GetAmbarByIdRequest
): Promise<GetAmbarByIdResponse> => {
    const res = await api.post<ApiResponse<GetAmbarByIdResponse>>('/Ambar/GetAmbarById', body);

    return res.data.data; // 👈 burada type-safe
};

export const updateAmbarProduct = async (
    body: UpdateAmbarProductRequest
): Promise<UpdateAmbarProductResponse> => {
    const res = await api.post<ApiResponse<UpdateAmbarProductResponse>>('/Ambar/UpdateAmbarProduct', body);

    return res.data.data; // 👈 burada type-safe
};

export const ambarSetLoadDate = async (
    body: AmbarSetLoadDateRequest
): Promise<AmbarSetLoadDateResponse> => {
    const res = await api.post<ApiResponse<AmbarSetLoadDateResponse>>('/Ambar/AmbarSetLoadDate', body);

    Alert.alert(res.data.message ?? '');
    return res.data.data; // 👈 burada type-safe
};

export const ambarSetLoadEndDate = async (
    body: AmbarSetLoadEndDateRequest
): Promise<AmbarSetLoadEndDateResponse> => {
    const res = await api.post<ApiResponse<AmbarSetLoadEndDateResponse>>('/Ambar/AmbarSetLoadEndDate', body);

    Alert.alert(res.data.message ?? '');
    return res.data.data; // 👈 burada type-safe
};

export const ambarSetDeliveryDate = async (
    body: AmbarSetDeliveryDateRequest
): Promise<AmbarSetDeliveryDateResponse> => {
    const res = await api.post<ApiResponse<AmbarSetDeliveryDateResponse>>('/Ambar/AmbarSetDeliveryDate', body);

    Alert.alert(res.data.message ?? '');
    return res.data.data; // 👈 burada type-safe
};

export const ambarSetDeliveryEndDate = async (
    body: AmbarSetDeliveryEndDateRequest
): Promise<AmbarSetDeliveryEndDateResponse> => {
    const res = await api.post<ApiResponse<AmbarSetDeliveryEndDateResponse>>('/Ambar/AmbarSetDeliveryEndDate', body);

    Alert.alert(res.data.message ?? '');
    return res.data.data; // 👈 burada type-safe
};