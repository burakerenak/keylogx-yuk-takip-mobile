import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CalendarClock, Clock, QrCode, Truck } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useMesaiKartStore } from '../store/mesaiKartStore';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getAmbarVoyageList } from '../api/ambarVoyage';
import { getMesaiDurum, getMesaiTalebiListe } from '../api/mesai';
import { MesaiDurumResponse } from '../types/mesai.types';
import BottomMenu from '../components/BottomMenu';
import { Dugme, Yazi } from '../ui';
import { seferDurumu } from '../utils/sefer';
import { useKullaniciTuru } from '../utils/kullanici';
import { saattenBeri, sayacMetni, sunucuZamaniCoz } from '../utils/mesai';
import { anaSayfaKartlari, gunOzeti, gunOzetiMetni, isoTarih, isTipiBuyuk, isTipiRengi } from '../utils/mesaiPlanlama';

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
 * Ana sayfa (4.3, 09.10.2026; 4.4 QR mesai 11.10.2026; 4.6 Faz 2 18.10.2026).
 *
 * - Mesai karti her odaklanmada Mesai/Durum'dan yenilenir: kapaliyken "Mesai Başlat"; aciksa "Mesaiyi Bitir",
 *   yer + is tipi (buyuk harf LOJİSTİK / AMBALAJ) + canli sayac.
 * - 4.6 kartlar (sozlesme 4.1, R11): Durum.kartlar gorev yetkisinden gelir; Gorevlerim / Mesai Planlama kartlari
 *   yalniz acik mesai kaydi varken gorunur, mesai kapaninca gizlenir; kapaliyken ipucu "… mesainiz başlayınca açılır".
 *   Karar utils/mesaiPlanlama.ts anaSayfaKartlari'nda. Sunucu kartlar gondermezse (eski sunucu) 4.5 davranisi:
 *   Gorevlerim surucu kaydi olan kullanicida her zaman gorunur.
 * - Gorevlerim seferleri surucu kaydina bagli oldugu icin kart yalniz surucu kaydi olan kullanicida gosterilir.
 * - Mesai Planlama karti: bugunku talep sayisi + eksik kisi (MesaiTalebi/Liste, sessiz).
 */
export default function HomeScreen() {
    const user = useAuthStore((s) => s.user);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { surucu, personel } = useKullaniciTuru();

    const [ozet, setOzet] = useState<{ toplam: number, baslatilmadi: number, yolda: number } | undefined>(undefined);
    const [mesai, setMesai] = useState<MesaiDurumResponse | undefined>(undefined);
    const [planOzeti, setPlanOzeti] = useState<{ talep: number, eksik: number } | undefined>(undefined);
    /** Sunucu saati - telefon saati (ms); sayac telefonun saati yanlis olsa da dogru calissin. */
    const [saatFarki, setSaatFarki] = useState(0);
    const [simdi, setSimdi] = useState(() => Date.now());

    useFocusEffect(useCallback(() => {
        (async () => {
            let durum: MesaiDurumResponse | undefined;

            try {
                durum = await getMesaiDurum();
                const sunucu = sunucuZamaniCoz(durum?.sunucuZamani);

                setSaatFarki(sunucu !== null ? sunucu - Date.now() : 0);
                setMesai(durum);
            } catch {
                // Sessiz istek: kart varsayilan metinle kalir.
                setMesai(undefined);
            }

            const karar = anaSayfaKartlari({
                kartlar: durum?.kartlar,
                acikKayitVar: !!(durum?.personel?.acikKayit ?? durum?.surucu?.acikKayit),
                surucu,
                personel,
            });

            if (!karar.mesaiPlanlama) {
                setPlanOzeti(undefined);
                return;
            }

            try {
                const bugun = isoTarih(new Date());
                setPlanOzeti(gunOzeti(await getMesaiTalebiListe({ baslangic: bugun, bitis: bugun, durum: 'PLAN' }, true)));
            } catch {
                setPlanOzeti(undefined);
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
    }, [surucu, personel, user?.driverId]));

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

    const karar = anaSayfaKartlari({ kartlar: mesai?.kartlar, acikKayitVar: !!acikKayit, surucu, personel });
    const gorevlerimGoster = karar.gorevlerim && surucu;

    // Alt menudeki Gorevlerim sekmesi de ayni karara uyar (21.10.2026); durum okunmadan once eski davranis kalir.
    const setGorevlerimSekmesi = useMesaiKartStore((s) => s.setGorevlerim);
    useEffect(() => {
        if (mesai !== undefined)
            setGorevlerimSekmesi(gorevlerimGoster);
    }, [mesai, gorevlerimGoster, setGorevlerimSekmesi]);

    const durumSatirlari: string[] = [];

    if (depoKaydi)
        durumSatirlari.push(`${depoKaydi.noktaAdi} · ${saattenBeri(depoKaydi.girisSaati)} beri`);

    if (aracKaydi)
        durumSatirlari.push(`Sürücü kaydı açık · ${aracKaydi.noktaAdi} · ${saattenBeri(aracKaydi.girisSaati)} beri`);

    // 4.6: depo kaydinda is tipi QR'dan gelir; buyuk harfle, renkli rozet (Lojistik mavi, Ambalaj turuncu).
    const isTipiAdi = depoKaydi?.isTipiAdi ?? null;

    let altMetin: string;

    if (!mesai)
        altMetin = 'Mesainizi başlatın ve bitirin';
    else if (personelMi)
        altMetin = calisma?.calisir && calisma.baslangic && calisma.bitis
            ? `Bugünkü çalışma saatiniz ${calisma.baslangic} – ${calisma.bitis}`
            : calisma && !calisma.calisir
                ? 'Bugün çalışma saatiniz yok; okutulan süre ek mesai sayılır'
                : 'Bulunduğunuz yerdeki QR kodu okutun';
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
                                ? <Hap metin={acikKayit ? 'Mesaide' : 'Mesai başlamadı'} vurgu={!!acikKayit} />
                                : null
                        }
                    </View>
                    <View style={{ gap: 4 }}>
                        <Text style={s.kartBaslik}>{acikKayit ? 'Mesaidesiniz' : 'Mesai Başlangıcı'}</Text>
                        {
                            isTipiAdi
                                ? (
                                    <View style={[s.isTipi, { backgroundColor: isTipiRengi(isTipiAdi) }]} accessibilityLabel={`İş tipi ${isTipiAdi}`}>
                                        <Text style={s.isTipiYazi}>{isTipiBuyuk(isTipiAdi)}</Text>
                                    </View>
                                )
                                : null
                        }
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
                        metin={acikKayit ? 'Mesaiyi Bitir' : 'Mesai Başlat'}
                        tur="cizgili"
                        ikon={<QrCode size={22} color={c.ink} />}
                        onPress={() => navigation.navigate('MesaiQr')}
                    />
                </View>

                {
                    karar.ipucu
                        ? <Yazi tur="kucuk" style={{ textAlign: 'center' }}>{karar.ipucu}</Yazi>
                        : null
                }

                {
                    gorevlerimGoster
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

                {
                    karar.mesaiPlanlama
                        ? (
                            <TouchableOpacity activeOpacity={0.88} onPress={() => navigation.navigate('MesaiPlanlama')} style={[s.buyukKart, { backgroundColor: '#5B21B6' }]}>
                                <View style={s.ikonKutu}><CalendarClock size={28} color={c.white} /></View>
                                <View style={{ gap: 4 }}>
                                    <Text style={s.kartBaslik}>Mesai Planlama</Text>
                                    <Text style={[s.kartAlt, { color: '#E9E3FF' }]}>{gunOzetiMetni(planOzeti)}</Text>
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
    isTipi: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginVertical: 4 },
    isTipiYazi: { fontSize: 20, fontWeight: '800', letterSpacing: 1.2, color: c.white },
    sayacKutu: { alignItems: 'center', marginTop: 10, marginBottom: 6, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)' },
    sayac: { fontSize: 42, fontWeight: '700', color: c.white, letterSpacing: 1, fontVariant: ['tabular-nums'] },
    sayacEtiket: { fontSize: 13, fontWeight: '600', color: '#CDEDEA', marginTop: 2 },
});
