import { api } from './client';
import { ApiResponse } from '../types/api.types';
import { EndAmbarVoyageRequest, EndAmbarVoyageResponse, GetAmbarVoyageByIdRequest, GetAmbarVoyageByIdResponse, GetAmbarVoyageListRequest, GetAmbarVoyageListResponse, StartAmbarVoyageRequest, StartAmbarVoyageResponse } from '../types/ambarVoyage.types';
import { Alert } from 'react-native';

export const getAmbarVoyageList = async (
    body: GetAmbarVoyageListRequest
): Promise<GetAmbarVoyageListResponse> => {
    const res = await api.post<ApiResponse<GetAmbarVoyageListResponse>>('/AmbarVoyage/GetAmbarVoyageList', body);

    return res.data.data; // 👈 burada type-safe
};

export const getAmbarVoyageById = async (
    body: GetAmbarVoyageByIdRequest
): Promise<GetAmbarVoyageByIdResponse> => {
    const res = await api.post<ApiResponse<GetAmbarVoyageByIdResponse>>('/AmbarVoyage/GetAmbarVoyageById', body);

    return res.data.data; // 👈 burada type-safe
};

export const startAmbarVoyage = async (
    body: StartAmbarVoyageRequest
): Promise<StartAmbarVoyageResponse> => {
    const res = await api.post<ApiResponse<StartAmbarVoyageResponse>>('/AmbarVoyage/StartAmbarVoyage', body);

    Alert.alert(res.data.message ?? '');
    return res.data.data; // 👈 burada type-safe
};

export const endAmbarVoyage = async (
    body: EndAmbarVoyageRequest
): Promise<EndAmbarVoyageResponse> => {
    const res = await api.post<ApiResponse<EndAmbarVoyageResponse>>('/AmbarVoyage/EndAmbarVoyage', body);

    Alert.alert(res.data.message ?? '');
    return res.data.data; // 👈 burada type-safe
};