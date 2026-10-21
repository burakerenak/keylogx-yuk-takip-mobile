import * as Keychain from 'react-native-keychain';
import { LoginResponse } from '../types/user.types';

const USER_KEY = 'user';

export const saveUser = async (user: LoginResponse): Promise<void> => {
    await Keychain.setInternetCredentials(
        USER_KEY,
        USER_KEY,
        JSON.stringify(user)
    );
};

export const getUser = async (): Promise<LoginResponse | null> => {
    const credentials = await Keychain.getInternetCredentials(USER_KEY);

    if (credentials === false) {
        return null;
    }

    return JSON.parse(credentials.password) as LoginResponse;
};

/**
 * Hatirlanan kullaniciyi siler (Cikis Yap, "Beni hatirla" kapali giris, sifre degisimi).
 * Kayit setInternetCredentials(server = USER_KEY) ile yapildigi icin silme de server ile olmali; eskiden
 * { service } veriliyordu, kayit silinmiyor ve uygulama yeniden acilinca cikis yapilan kullaniciyla giriyordu (21.10.2026).
 */
export const deleteUser = async (): Promise<void> => {
    await Keychain.resetInternetCredentials({
        server: USER_KEY,
    });
};