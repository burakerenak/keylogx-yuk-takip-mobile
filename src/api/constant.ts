import { ApiResponse } from "../types/api.types";
import { GetConstantListRequest, GetConstantListResponse } from "../types/constant.types";
import { api } from "./client";

export const getConstantList = async (
    body: GetConstantListRequest
): Promise<GetConstantListResponse> => {
    const res = await api.post<ApiResponse<GetConstantListResponse>>('/Constant/GetConstantList', body);

    return res.data.data; // 👈 burada type-safe
};