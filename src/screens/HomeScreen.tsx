import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Clock, Cog, Settings, Truck } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getAmbarVoyageList } from '../api/ambarVoyage';
import BottomMenu from '../components/BottomMenu';
import { Dugme, Yazi } from '../ui';
import { seferDurumu } from '../utils/sefer';

const c = theme.colors;

const selam = () => {
    const saat = new Date().getHours();

    return saat < 12 ? 'Günaydın,' : saat < 18 ? 'İyi günler,' : 'İyi akşamlar,';
};

/** Donen disli (Mesai "yapim asamasinda" penceresi). */
const DonenIkon = ({ ters, sure, children }: { ters?: boolean, sure: number, children: React.ReactNode }) => {
    const deger = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const dongu = Animated.loop(Animated.timing(deger, { toValue: 1, duration: sure, easing: Easing.linear, useNativeDriver: true }));
        dongu.start();
        return () => dongu.stop();
    }, []);

    const rotate = deger.interpolate({ inputRange: [0, 1], outputRange: ters ? ['360deg', '0deg'] : ['0deg', '360deg'] });

    return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
};

/**
 * Ana sayfa (4.3, 09.10.2026): selamlama, Mesai Baslangici (simdilik "yapim asamasinda") ve Gorevlerim.
 * Gorevlerim kartindaki ozet seferlerden hesaplanir.
 */
export default function HomeScreen() {
    const user = useAuthStore((s) => s.user);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    const [mesaiAcik, setMesaiAcik] = useState(false);
    const [ozet, setOzet] = useState<{ toplam: number, baslatilmadi: number, yolda: number } | undefined>(undefined);

    useFocusEffect(useCallback(() => {
        (async () => {
            try {
                const liste = (await getAmbarVoyageList({ driverId: user?.driverId })) ?? [];
                const aktif = liste.filter(x => seferDurumu(x) !== 'Tamamlandı');

                setOzet({
                    toplam: aktif.length,
                    baslatilmadi: aktif.filter(x => seferDurumu(x) === 'Başlatılmadı').length,
                    yolda: aktif.filter(x => seferDurumu(x) === 'Yolda').length,
                });
            } catch {
                setOzet(undefined);
            }
        })();
    }, []));

    const tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

    return (
        <View style={s.sayfa}>
            <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.bg }} />

            <ScrollView contentContainerStyle={s.govde}>
                <View style={s.ust}>
                    <Image source={require('../assets/keylogx-logo.png')} style={s.logo} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                        <Yazi tur="kucuk">{selam()}</Yazi>
                        <Yazi tur="baslik" satir={1} style={{ fontSize: 20 }}>{user?.nameSurname ?? ''}</Yazi>
                    </View>
                </View>
                <Yazi tur="kucuk" style={{ marginBottom: 18 }}>{tarih}</Yazi>

                <TouchableOpacity activeOpacity={0.88} onPress={() => setMesaiAcik(true)} style={[s.buyukKart, { backgroundColor: c.teal }]}>
                    <View style={s.ikonKutu}><Clock size={28} color={c.white} /></View>
                    <View style={{ gap: 4 }}>
                        <Text style={s.kartBaslik}>Mesai Başlangıcı</Text>
                        <Text style={[s.kartAlt, { color: '#CDEDEA' }]}>Mesainizi başlatın ve bitirin</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.88} onPress={() => navigation.navigate('Tasks')} style={[s.buyukKart, { backgroundColor: c.blue }]}>
                    <View style={s.ikonKutu}><Truck size={28} color={c.white} /></View>
                    <View style={{ gap: 4 }}>
                        <Text style={s.kartBaslik}>Görevlerim</Text>
                        <Text style={[s.kartAlt, { color: '#DCE7FF' }]}>
                            {ozet ? `${ozet.toplam} aktif sefer · ${ozet.baslatilmadi} başlatılmadı · ${ozet.yolda} yolda` : 'Seferlerinizi görün'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            <BottomMenu activeIndex={0} />

            <Modal visible={mesaiAcik} transparent animationType="slide" onRequestClose={() => setMesaiAcik(false)}>
                <View style={s.perde}>
                    <View style={s.pencere}>
                        <View style={s.disliler}>
                            <DonenIkon sure={3000}><Settings size={60} color={c.teal} strokeWidth={1.6} /></DonenIkon>
                            <View style={{ marginLeft: -6, marginTop: -18 }}>
                                <DonenIkon ters sure={2200}><Cog size={40} color={c.blue} strokeWidth={1.8} /></DonenIkon>
                            </View>
                        </View>
                        <Yazi tur="altBaslik" style={{ fontSize: 20 }}>Yapım aşamasında</Yazi>
                        <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center' }}>Mesai takibi çok yakında burada olacak.</Yazi>
                        <Dugme metin="Tamam" tur="koyu" onPress={() => setMesaiAcik(false)} style={{ alignSelf: 'stretch', marginTop: 8 }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    govde: { padding: 20, gap: 16, paddingBottom: 28 },
    ust: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.white },
    buyukKart: { borderRadius: 22, padding: 22, gap: 18, minHeight: 170 },
    ikonKutu: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    kartBaslik: { fontSize: 22, fontWeight: '700', color: c.white },
    kartAlt: { fontSize: 14 },
    perde: { flex: 1, backgroundColor: 'rgba(16,24,38,0.55)', justifyContent: 'flex-end' },
    pencere: { backgroundColor: c.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingBottom: 36, alignItems: 'center', gap: 12 },
    disliler: { flexDirection: 'row', alignItems: 'flex-start', height: 80, paddingTop: 10 },
});
