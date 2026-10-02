import { ApiResponse } from "../types/api.types";
import { SaveAsDraftIrsaliyeRequest, SaveAsDraftIrsaliyeResponse } from "../types/uyumsoft.types";
import { api } from "./client";

export const saveAsDraftIrsaliye = async (
    body: SaveAsDraftIrsaliyeRequest
): Promise<SaveAsDraftIrsaliyeResponse> => {
    const res = await api.post<ApiResponse<SaveAsDraftIrsaliyeResponse>>('/Uyumsoft/SaveAsDraftIrsaliye', body);

    return res.data.data; // 👈 burada type-safe
};