import { GetAmbarByIdResponse, GetAmbarByIdResponseAmbarProduct, GetAmbarListResponseData } from "../types/ambar.types";
import { GetAmbarVoyageListResponseAmbar, GetAmbarVoyageListResponseData } from "../types/ambarVoyage.types";

export type AppStackParamList = {
    Home?: {
        activeIndex: number
    };
    Detail: {
        ambarId: string
    },
    Map: {
        ambarVoyageId: string
    },
    Order: {
        ambarVoyageId: string
    },
    Profile: undefined,
    UpdateProduct: {
        ambar: GetAmbarByIdResponse
        ambarProduct: GetAmbarByIdResponseAmbarProduct
    }
};