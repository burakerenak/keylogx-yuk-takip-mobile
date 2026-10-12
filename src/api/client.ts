import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Alert } from 'react-native';
import { useLoadingStore } from '../store/loadingStore';
import { API_URL } from '../config';

declare module 'axios' {
    interface AxiosRequestConfig {
        /** true: hata olursa uyari penceresi gosterilmez (arka planda yenilenen ozetler icin). */
        sessiz?: boolean;
    }
}

/** Sunucu adresi src/config.ts'ten gelir (TEST derlemesi icin oradaki tek degeri degistirin). */
export const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    useLoadingStore.getState().show();

    const token = useAuthStore.getState().user?.token;
    const companyId = useAuthStore.getState().user?.companyId;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.set('SelectedCompanyId', companyId);
    }

    return config;
});

api.interceptors.response.use((response) => {
    useLoadingStore.getState().hide();

    const res = response.data;

    // 👉 BUSINESS ERROR HANDLING
    if (res && res.isSuccess === false) {
        if (!response.config?.sessiz)
            Alert.alert('Hata', res.message || 'Bir hata oluştu');

        // reject ederek service layer'a düşmesini engelliyoruz
        return Promise.reject(res);
    }

    return response;
}, (error) => {
    useLoadingStore.getState().hide();

    // HTTP ERROR HANDLING
    const message = error?.response?.data?.message || 'Sunucu hatası oluştu';



    // 401 ise logout örneği
    if (error?.response?.status === 401) {
        useAuthStore.getState().signOut();
    }
    else if (!error?.config?.sessiz) {
        Alert.alert('Hata', message);
    }

    return Promise.reject(error);
});