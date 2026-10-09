import { GetAmbarByIdResponse, GetAmbarByIdResponseAmbarProduct } from "../types/ambar.types";

export type AppStackParamList = {
    /** 4.3: Ana sayfa (Mesai Baslangici + Gorevlerim). */
    Home: undefined;
    /** 4.3: Gorevlerim = sefer listesi (eski ana ekran). */
    Tasks: undefined;
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
    ChangePassword: undefined,
    UpdateProduct: {
        ambar: GetAmbarByIdResponse
        ambarProduct: GetAmbarByIdResponseAmbarProduct
    }
};
