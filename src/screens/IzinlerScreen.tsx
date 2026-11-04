import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Bell, Camera, LocateFixed, MapPin } from 'lucide-react-native';
import { AppStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { Dugme, EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { izinleriErtele, izinleriOlc, satirIslemi } from '../services/izinDenetimi';
import { DUGME_METINLERI, IZIN_METINLERI, IzinSatirAdi, IzinSatiri, eksikVarMi } from '../utils/izinler';

const c = theme.colors;

const IKONLAR: Record<IzinSatirAdi, typeof MapPin> = {
    konumIzni: MapPin,
    konumServisi: LocateFixed,
    bildirim: Bell,
    kamera: Camera,
};

/**
 * Izinler (04.11.2026, #542): giristen sonra ve uygulama her acildiginda (oturum acikken) eksik izin varsa acilir.
 * - Satirlar: Konum izni, Konum servisi (yalniz Android), Bildirim izni, Kamera izni; her birinde durum + dugme.
 * - Dugme: istenebiliyorsa "İzin ver", kalici reddedildiyse "Ayarları aç", telefonun konumu kapaliysa "Konumu aç".
 * - Uygulama one gelince (ayarlardan donus) satirlar yeniden olculur; hepsi tamamsa ekran kendiliginden kapanir.
 * - "Daha sonra" bu acilista gecer (bellekte); sonraki acilista eksik varsa yine sorulur.
 */
export default function IzinlerScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    const [satirlar, setSatirlar] = useState<IzinSatiri[] | undefined>(undefined);
    const [islemde, setIslemde] = useState<IzinSatirAdi | undefined>(undefined);
    const kapandi = useRef(false);

    const kapat = useCallback(() => {
        if (kapandi.current)
            return;

        kapandi.current = true;

        if (navigation.canGoBack())
            navigation.goBack();
        else
            navigation.navigate('Home');
    }, [navigation]);

    const olc = useCallback(async () => {
        const yeni = await izinleriOlc();

        setSatirlar(yeni);

        if (!eksikVarMi(yeni))
            kapat();
    }, [kapat]);

    useEffect(() => { olc(); }, [olc]);

    // Ayarlardan / izin penceresinden donunce yeniden olculur.
    useEffect(() => {
        const abonelik = AppState.addEventListener('change', durum => {
            if (durum === 'active')
                olc();
        });

        return () => abonelik.remove();
    }, [olc]);

    // Ekran hangi yolla kapanirsa kapansin (Daha sonra, geri tusu) bu acilista yeniden acilmaz.
    useEffect(() => () => izinleriErtele(), []);

    const dugmeyeBas = async (_satir: IzinSatiri) => {
        setIslemde(_satir.ad);

        try {
            await satirIslemi(_satir);
        } finally {
            setIslemde(undefined);
        }

        // Ayarlar acildiysa olcum uygulama one gelince de yapilir.
        await olc();
    };

    const satir = (_s: IzinSatiri) => {
        const Ikon = IKONLAR[_s.ad];
        const metin = IZIN_METINLERI[_s.ad];

        return (
            <Kart key={_s.ad} style={{ gap: 12 }}>
                <View style={st.satir}>
                    <View style={[st.ikon, { backgroundColor: _s.tamam ? c.greenSoft : c.redSoft }]}>
                        <Ikon size={22} color={_s.tamam ? c.greenDark : c.red} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <Yazi tur="govdeKalin">{metin.baslik}</Yazi>
                        <Yazi tur="kucuk">{metin.aciklama}</Yazi>
                    </View>
                    <Etiket metin={_s.tamam ? 'Tamam' : 'Eksik'} ton={_s.tamam ? 'yesil' : 'kirmizi'} />
                </View>
                {
                    !_s.tamam && _s.dugme
                        ? <Dugme metin={DUGME_METINLERI[_s.dugme]} kucuk onPress={() => dugmeyeBas(_s)} yukleniyor={islemde === _s.ad} pasif={!!islemde && islemde !== _s.ad} />
                        : null
                }
            </Kart>
        );
    };

    return (
        <View style={st.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="İzinler" altBaslik="Uygulamanın düzgün çalışması için" onGeri={kapat} />

            {
                satirlar
                    ? (
                        <ScrollView contentContainerStyle={st.govde}>
                            <Yazi tur="govde" style={{ color: c.inkSoft }}>
                                Mesai okutma, yük teslimi ve bildirimlerin çalışması için aşağıdaki izinler gereklidir.
                            </Yazi>
                            {satirlar.map(satir)}
                        </ScrollView>
                    )
                    : <View style={st.orta}><ActivityIndicator color={c.blue} size="large" /></View>
            }

            <SafeAreaView edges={['bottom']} style={st.alt}>
                <Dugme metin="Daha sonra" tur="cizgili" onPress={kapat} />
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    govde: { padding: 16, gap: 12, paddingBottom: 24 },
    orta: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ikon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    alt: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
});
