import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Clock, QrCode, Truck } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getAmbarVoyageList } from '../api/ambarVoyage';
import { getMesaiDurum } from '../api/mesai';
import { MesaiDurumResponse } from '../types/mesai.types';
import BottomMenu from '../components/BottomMenu';
import { Dugme, Yazi } from '../ui';
import { seferDurumu } from '../utils/sefer';
import { useKullaniciTuru } from '../utils/kullanici';
import { saattenBeri, sayacMetni, sunucuZamaniCoz } from '../utils/mesai';

const c = theme.colors;

const selam = () => {
    const saat = new Date().getHours();

    return saat < 12 ? 'Günaydın,' : saat < 18 ? 'İyi günler,' : 'İyi akşamlar,';
};

/** Mesai kartindaki durum hapi (teal zemin uzerinde). */
const Hap = ({ metin, vurgu }: { metin: string, vurgu?: boolean }) => (
    <View style={[s.hap, { backgroundColor: vurgu ? c.white : 'rgba(255,255,255,0.18)' }]}>
        <Text style={[s.hapYazi, { color: vurgu ? c.tealDark : c.white }]}>{metin}</Text>
    </View>
);

/**
 * Ana sayfa (4.3, 09.10.2026; 4.4 QR mesai 11.10.2026): selamlama, Mesai Baslangici ve Gorevlerim.
 *
 * - Mesai karti her odaklanmada Mesai/Durum'dan yenilenir: "Mesai başlamadı" / "Mesaide · nokta · HH:mm'den beri" /
 *   "Sürücü kaydı açık · plaka"; personelde bugunku calisma saati. "QR Okut" kamerayi acar.
 * - Gorevlerim karti (ve sefer ozeti) yalniz surucu kaydi olan kullanicida; yalniz personel olan kullanici gormez.
 */
export default function HomeScreen() {
    const user = useAuthStore((s) => s.user);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { surucu } = useKullaniciTuru();

    const [ozet, setOzet] = useState<{ toplam: number, baslatilmadi: number, yolda: number } | undefined>(undefined);
    const [mesai, setMesai] = useState<MesaiDurumResponse | undefined>(undefined);
    /** Sunucu saati - telefon saati (ms); sayac telefonun saati yanlis olsa da dogru calissin. */
    const [saatFarki, setSaatFarki] = useState(0);
    const [simdi, setSimdi] = useState(() => Date.now());

    useFocusEffect(useCallback(() => {
        (async () => {
            try {
                const durum = await getMesaiDurum();
                const sunucu = sunucuZamaniCoz(durum?.sunucuZamani);

                setSaatFarki(sunucu !== null ? sunucu - Date.now() : 0);
                setMesai(durum);
            } catch {
                // Sessiz istek: kart varsayilan metinle kalir.
                setMesai(undefined);
            }
        })();

        if (!surucu) {
            setOzet(undefined);
            return;
        }

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
    }, [surucu, user?.driverId]));

    const tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

    // ------------------------------------------------------------ Mesai karti metinleri

    const depoKaydi = mesai?.personel?.acikKayit ?? null;
    const aracKaydi = mesai?.surucu?.acikKayit ?? null;
    const personelMi = !!mesai?.personel || !!user?.personnelId;
    const calisma = mesai?.bugunCalismaSaati ?? null;

    // Canli mesai sayaci (12.10.2026): acik kaydin girisinden beri gecen sure, saniyede bir; ekran odakta degilse durur.
    const acikKayit = depoKaydi ?? aracKaydi;
    const girisMs = sunucuZamaniCoz(acikKayit?.girisZamani);

    useFocusEffect(useCallback(() => {
        if (girisMs === null)
            return;

        setSimdi(Date.now());
        const zamanlayici = setInterval(() => setSimdi(Date.now()), 1000);

        return () => clearInterval(zamanlayici);
    }, [girisMs]));

    const gecenSure = girisMs !== null ? sayacMetni(simdi + saatFarki - girisMs) : null;

    const durumSatirlari: string[] = [];

    if (depoKaydi)
        durumSatirlari.push(`Mesaide · ${depoKaydi.noktaAdi} · ${saattenBeri(depoKaydi.girisSaati)} beri`);

    if (aracKaydi)
        durumSatirlari.push(`Sürücü kaydı açık · ${aracKaydi.noktaAdi} · ${saattenBeri(aracKaydi.girisSaati)} beri`);

    let altMetin: string;

    if (!mesai)
        altMetin = 'Mesainizi başlatın ve bitirin';
    else if (personelMi)
        altMetin = calisma?.calisir && calisma.baslangic && calisma.bitis
            ? `Bugünkü çalışma saatiniz ${calisma.baslangic} – ${calisma.bitis}`
            : calisma && !calisma.calisir
                ? 'Bugün çalışma saatiniz yok; okutulan süre ek mesai sayılır'
                : 'Depodaki QR kodu okutun';
    else
        altMetin = 'Araçtaki QR kodu okutun';

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

                <View style={[s.buyukKart, { backgroundColor: c.teal }]}>
                    <View style={s.kartUst}>
                        <View style={s.ikonKutu}><Clock size={28} color={c.white} /></View>
                        {
                            mesai
                                ? <Hap metin={depoKaydi || aracKaydi ? 'Mesaide' : 'Mesai başlamadı'} vurgu={!!(depoKaydi || aracKaydi)} />
                                : null
                        }
                    </View>
                    <View style={{ gap: 4 }}>
                        <Text style={s.kartBaslik}>{depoKaydi || aracKaydi ? 'Mesaidesiniz' : 'Mesai Başlangıcı'}</Text>
                        {durumSatirlari.map(x => <Text key={x} style={[s.kartAlt, { color: c.white, fontWeight: '600' }]}>{x}</Text>)}
                        {
                            gecenSure
                                ? (
                                    <View style={s.sayacKutu} accessibilityLabel={`Mesai süresi ${gecenSure}`}>
                                        <Text style={s.sayac}>{gecenSure}</Text>
                                        <Text style={s.sayacEtiket}>Mesai süresi</Text>
                                    </View>
                                )
                                : null
                        }
                        <Text style={[s.kartAlt, { color: '#CDEDEA' }]}>{altMetin}</Text>
                    </View>
                    <Dugme
                        // Buton adi duruma gore (12.10.2026, Burak): acik mesai yoksa baslat, varsa bitir; ikisi de QR okutur.
                        metin={depoKaydi || aracKaydi ? 'Mesaiyi Bitir' : 'Mesai Başlat'}
                        tur="cizgili"
                        ikon={<QrCode size={22} color={c.ink} />}
                        onPress={() => navigation.navigate('MesaiQr')}
                    />
                </View>

                {
                    surucu
                        ? (
                            <TouchableOpacity activeOpacity={0.88} onPress={() => navigation.navigate('Tasks')} style={[s.buyukKart, { backgroundColor: c.blue }]}>
                                <View style={s.ikonKutu}><Truck size={28} color={c.white} /></View>
                                <View style={{ gap: 4 }}>
                                    <Text style={s.kartBaslik}>Görevlerim</Text>
                                    <Text style={[s.kartAlt, { color: '#DCE7FF' }]}>
                                        {ozet ? `${ozet.toplam} aktif sefer · ${ozet.baslatilmadi} başlatılmadı · ${ozet.yolda} yolda` : 'Seferlerinizi görün'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )
                        : null
                }
            </ScrollView>

            <BottomMenu activeIndex={0} />
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    govde: { padding: 20, gap: 16, paddingBottom: 28 },
    ust: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.white },
    buyukKart: { borderRadius: 22, padding: 22, gap: 18, minHeight: 170 },
    kartUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ikonKutu: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    kartBaslik: { fontSize: 22, fontWeight: '700', color: c.white },
    kartAlt: { fontSize: 14 },
    hap: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    hapYazi: { fontSize: 13, fontWeight: '700' },
    sayacKutu: { alignItems: 'center', marginTop: 10, marginBottom: 6, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)' },
    sayac: { fontSize: 42, fontWeight: '700', color: c.white, letterSpacing: 1, fontVariant: ['tabular-nums'] },
    sayacEtiket: { fontSize: 13, fontWeight: '600', color: '#CDEDEA', marginTop: 2 },
});
