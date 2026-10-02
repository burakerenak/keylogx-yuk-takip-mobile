import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Alert } from 'react-native';
import { useLoadingStore } from '../store/loadingStore';

export const api = axios.create({
    baseURL: 'https://keylogxapi.ebbedev.com.tr',
    // baseURL: 'http://192.168.1.6:7048',
    // baseURL: 'http://149.0.252.220:60000'
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
    else {
        Alert.alert('Hata', message);
    }

    return Promise.reject(error);
});