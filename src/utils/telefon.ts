import { Alert, Linking } from 'react-native';
import { telefonAramaAdresi } from './telefonAdres';

export { telefonAramaAdresi };

/** Telefonun arama ekranını açar; Android ve iOS'ta aynı (Linking + tel:). */
export const telefonAra = async (telefon?: string | null) => {
    const adres = telefonAramaAdresi(telefon);

    if (!adres)
        return;

    try {
        await Linking.openURL(adres);
    } catch {
        Alert.alert('Hata', 'Arama başlatılamadı.');
    }
};
