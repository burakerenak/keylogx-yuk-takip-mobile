import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { GetAmbarVoyageListResponseData } from '../types/ambarVoyage.types';
import { getAmbarVoyageList } from '../api/ambarVoyage';
import BottomMenu from '../components/BottomMenu';
import { EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { buHaftaBitti, durumTonu, kmMetni, plakaMetni, rota, SeferDurumu, seferDurumu, toplamKm } from '../utils/sefer';

const c = theme.colors;

type Filtre = 'Aktif' | 'Başlatılmadı' | 'Yolda' | 'Tamamlanan';
const FILTRELER: Filtre[] = ['Aktif', 'Başlatılmadı', 'Yolda', 'Tamamlanan'];

/**
 * Gorevlerim (4.3, 09.10.2026): seferlerin durum sayaclari, suzgecler ve kartlar
 * (durum etiketi, nereden -> nereye, tarih / km / yuk sayisi, sagda plaka - dorse).
 */
export default function TasksScreen() {
    const user = useAuthStore((s) => s.user);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    const [seferler, setSeferler] = useState<GetAmbarVoyageListResponseData[]>([]);
    const [filtre, setFiltre] = useState<Filtre>('Aktif');
    const [yenileniyor, setYenileniyor] = useState(false);

    const yukle = async () => {
        try {
            const liste = await getAmbarVoyageList({ driverId: user?.driverId });
            setSeferler(liste ?? []);
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        }
    };

    useFocusEffect(useCallback(() => { yukle(); }, []));

    const yenile = async () => {
        setYenileniyor(true);
        await yukle();
        setYenileniyor(false);
    };

    const sayilar = useMemo(() => ({
        baslatilmadi: seferler.filter(x => seferDurumu(x) === 'Başlatılmadı').length,
        yolda: seferler.filter(x => seferDurumu(x) === 'Yolda').length,
        buHafta: seferler.filter(x => buHaftaBitti(x.endDate)).length,
    }), [seferler]);

    const gorunen = useMemo(() => seferler.filter(x => {
        const d: SeferDurumu = seferDurumu(x);

        if (filtre === 'Aktif') return d !== 'Tamamlandı';
        if (filtre === 'Tamamlanan') return d === 'Tamamlandı';
        return d === filtre;
    }), [seferler, filtre]);

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Görevlerim" onGeri={() => navigation.navigate('Home')} />

            <View style={s.ozet}>
                <View style={[s.sayac, { backgroundColor: c.amberSoft }]}>
                    <Text style={[s.sayi, { color: c.amberDark }]}>{sayilar.baslatilmadi}</Text>
                    <Text style={[s.sayacYazi, { color: c.amberDark }]}>Başlatılmadı</Text>
                </View>
                <View style={[s.sayac, { backgroundColor: c.blueSoft }]}>
                    <Text style={[s.sayi, { color: c.blueDark }]}>{sayilar.yolda}</Text>
                    <Text style={[s.sayacYazi, { color: c.blueDark }]}>Yolda</Text>
                </View>
                <View style={[s.sayac, { backgroundColor: c.greenSoft }]}>
                    <Text style={[s.sayi, { color: c.greenDark }]}>{sayilar.buHafta}</Text>
                    <Text style={[s.sayacYazi, { color: c.greenDark }]}>Bu hafta biten</Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtreKap} contentContainerStyle={s.filtreler}>
                {
                    FILTRELER.map(f => (
                        <TouchableOpacity key={f} onPress={() => setFiltre(f)} style={[s.filtre, f === filtre ? s.filtreAktif : null]} accessibilityState={{ selected: f === filtre }}>
                            <Text style={[s.filtreYazi, f === filtre ? { color: c.white } : null]}>{f}</Text>
                        </TouchableOpacity>
                    ))
                }
            </ScrollView>

            <ScrollView contentContainerStyle={s.liste} refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}>
                {
                    gorunen.map(x => {
                        const d = seferDurumu(x);
                        const r = rota(x.ambars ?? []);
                        const plaka = plakaMetni(x);
                        const tarih = x.endDateStr || x.startDateStr || x.createdDate;

                        return (
                            <Kart key={x.ambarVoyageId} onPress={() => navigation.navigate('Order', { ambarVoyageId: x.ambarVoyageId })} style={{ gap: 12 }}>
                                <View style={s.kartUst}>
                                    <Yazi tur="govdeKalin" style={{ fontWeight: '700' }}>{x.refNo}</Yazi>
                                    <Etiket metin={d} ton={durumTonu(d)} />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ alignItems: 'center', paddingTop: 5 }}>
                                        <View style={[s.nokta, { backgroundColor: c.blue }]} />
                                        <View style={s.cizgi} />
                                        <View style={[s.nokta, { backgroundColor: c.teal }]} />
                                    </View>
                                    <View style={{ flex: 1, gap: 8 }}>
                                        <Yazi tur="govdeKalin" satir={1}>{r.nereden || '—'}</Yazi>
                                        <Yazi tur="govdeKalin" satir={1}>{r.nereye || '—'}</Yazi>
                                    </View>
                                </View>

                                <View style={s.kartAlt}>
                                    <Yazi tur="kucuk" satir={1} style={{ flex: 1 }}>{tarih} · {kmMetni(toplamKm(x.ambars ?? []))} · {(x.ambars ?? []).length} yük</Yazi>
                                    {plaka ? <Text style={s.plaka}>{plaka}</Text> : null}
                                </View>
                            </Kart>
                        );
                    })
                }

                {
                    gorunen.length === 0 && (
                        <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>Bu süzgeçte sefer yok.</Yazi>
                    )
                }
            </ScrollView>

            <BottomMenu activeIndex={1} />
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    ozet: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, backgroundColor: c.white },
    sayac: { flex: 1, borderRadius: 14, padding: 12, gap: 2 },
    sayi: { fontSize: 22, fontWeight: '700' },
    sayacYazi: { fontSize: 12, fontWeight: '600' },
    filtreKap: { flexGrow: 0, backgroundColor: c.white, borderBottomWidth: 1, borderBottomColor: c.border },
    filtreler: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    filtre: { height: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#D5DAE3', backgroundColor: c.white, justifyContent: 'center' },
    filtreAktif: { backgroundColor: c.ink, borderColor: c.ink },
    filtreYazi: { fontSize: 14, fontWeight: '600', color: c.inkSoft },
    liste: { padding: 16, gap: 12, paddingBottom: 24 },
    kartUst: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    nokta: { width: 9, height: 9, borderRadius: 99 },
    cizgi: { width: 2, height: 18, backgroundColor: '#D5DAE3' },
    kartAlt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.divider },
    plaka: { fontSize: 13, fontWeight: '700', color: c.ink, backgroundColor: '#F1F3F7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
});
