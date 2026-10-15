import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import MapView, { LatLng, Marker, Polyline } from 'react-native-maps';
import Layout from '../layouts/Layout';
import { AppStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { getSeferGuzergah } from '../api/ambarVoyage';
import { SeferGuzergahDurak, SeferGuzergahResponse } from '../types/ambarVoyage.types';
import { Ayrac, Dugme, Etiket, Kart, Yazi } from '../ui';
import { sureMetni } from '../utils/mesai';

const c = theme.colors;

/** Yukleme noktasi mavi, teslim duraklari turkuaz (Yuklerim kartlarindaki nokta renkleriyle ayni). */
const YUKLEME_RENGI = c.blue;
const TESLIM_RENGI = c.teal;
const CIZGI_RENGI = c.blue;

type EkranDurumu =
    | { tur: 'yukleniyor' }
    | { tur: 'hata', mesaj: string }
    | { tur: 'tamam', veri: SeferGuzergahResponse };

const konumVar = (lat?: number | null, lon?: number | null): boolean =>
    typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon) && !(lat === 0 && lon === 0);

const kmMetni = (km?: number | null): string => `${(km ?? 0).toFixed(1)} km`;

/** isSuccess=false (sunucu mesaji) ya da ag / HTTP hatasi -> ekranda gosterilecek metin. */
const hataMesaji = (e: any): string => {
    if (e && e.isSuccess === false)
        return e.message || 'Güzergah alınamadı.';

    if (e?.response?.data?.message)
        return e.response.data.message;

    if (e?.response)
        return 'Sunucu hatası oluştu.';

    return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
};

/**
 * Sefer > Yuklerim > "Guzergah Goster" (15.10.2026): seferin teslim sirasi ve sunucunun hesapladigi gercek yol
 * cizgisi (POST /AmbarVoyage/Guzergah). Yalniz gosterim: navigasyon, fiyat, yukleme / teslim islemi YOK
 * (o islemler Yuklerim ekraninda). Geri -> Yuklerim.
 */
const MapScreen = () => {
    const route = useRoute<RouteProp<AppStackParamList, 'Map'>>();
    const mapRef = useRef<MapView>(null);

    const [durum, setDurum] = useState<EkranDurumu>({ tur: 'yukleniyor' });
    const [haritaHazir, setHaritaHazir] = useState(false);
    // Ozel isaretler ilk cizimde bos kalmasin diye kisa sure izlenir, sonra kapatilir (performans).
    const [isaretIzle, setIsaretIzle] = useState(true);

    const yukle = useCallback(async () => {
        setDurum({ tur: 'yukleniyor' });

        try {
            const veri = await getSeferGuzergah({ ambarVoyageId: route.params.ambarVoyageId });
            setDurum({ tur: 'tamam', veri: { ...veri, duraklar: veri?.duraklar ?? [], cizgiler: veri?.cizgiler ?? [] } });
        } catch (e) {
            setDurum({ tur: 'hata', mesaj: hataMesaji(e) });
        }
    }, [route.params.ambarVoyageId]);

    useEffect(() => {
        yukle();
    }, [yukle]);

    const veri = durum.tur === 'tamam' ? durum.veri : undefined;

    const baslangic: LatLng | undefined = useMemo(() => (
        veri && konumVar(veri.baslangicLat, veri.baslangicLon)
            ? { latitude: veri.baslangicLat as number, longitude: veri.baslangicLon as number }
            : undefined
    ), [veri]);

    const konumluDuraklar = useMemo(() => (
        (veri?.duraklar ?? []).filter(x => konumVar(x.lat, x.lon))
    ), [veri]);

    /** Bacak bacak yol cizgisi; bozuk nokta atlanir, 2 noktadan az kalan bacak cizilmez. */
    const bacaklar: LatLng[][] = useMemo(() => (
        (veri?.cizgiler ?? [])
            .map(bacak => (bacak ?? [])
                .filter(n => Array.isArray(n) && n.length >= 2 && konumVar(n[0], n[1]))
                .map(n => ({ latitude: n[0], longitude: n[1] })))
            .filter(bacak => bacak.length >= 2)
    ), [veri]);

    const tumNoktalar: LatLng[] = useMemo(() => [
        ...(baslangic ? [baslangic] : []),
        ...konumluDuraklar.map(x => ({ latitude: x.lat as number, longitude: x.lon as number })),
        ...bacaklar.flat(),
    ], [baslangic, konumluDuraklar, bacaklar]);

    // Acilista tum noktalara sigacak sekilde yakinlas.
    useEffect(() => {
        if (!haritaHazir || tumNoktalar.length === 0)
            return;

        if (tumNoktalar.length === 1) {
            mapRef.current?.animateToRegion({ ...tumNoktalar[0], latitudeDelta: 0.05, longitudeDelta: 0.05 }, 300);
            return;
        }

        mapRef.current?.fitToCoordinates(tumNoktalar, {
            edgePadding: { top: 60, right: 50, bottom: 60, left: 50 },
            animated: true,
        });
    }, [haritaHazir, tumNoktalar]);

    useEffect(() => {
        if (!veri)
            return;

        setIsaretIzle(true);
        const t = setTimeout(() => setIsaretIzle(false), 800);

        return () => clearTimeout(t);
    }, [veri]);

    const baslik = (route.params.refNo ? route.params.refNo + ' ' : '') + 'Güzergah';

    return (
        <Layout title={baslik} hasPadding={false} canGoBack>
            {
                durum.tur === 'yukleniyor' && (
                    <View style={s.orta}>
                        <ActivityIndicator color={c.blue} size="large" />
                        <Yazi tur="kucuk" style={{ marginTop: 12 }}>Güzergah yükleniyor...</Yazi>
                    </View>
                )
            }

            {
                durum.tur === 'hata' && (
                    <View style={s.orta}>
                        <Kart style={{ alignSelf: 'stretch', gap: 14 }}>
                            <Yazi tur="govdeKalin">Güzergah gösterilemiyor</Yazi>
                            <Yazi tur="govde" style={{ color: c.muted }}>{durum.mesaj}</Yazi>
                            <Dugme kucuk tur="cizgili" metin="Tekrar Dene" onPress={yukle} />
                        </Kart>
                    </View>
                )
            }

            {
                veri && (
                    <View style={{ flex: 1 }}>
                        {
                            tumNoktalar.length > 0 ? (
                                <MapView
                                    ref={mapRef}
                                    style={{ flex: 1 }}
                                    onMapReady={() => setHaritaHazir(true)}
                                    toolbarEnabled={false}
                                >
                                    {
                                        bacaklar.map((bacak, i) => (
                                            <Polyline
                                                key={'bacak-' + i}
                                                coordinates={bacak}
                                                strokeColor={CIZGI_RENGI}
                                                strokeWidth={5}
                                                lineCap="round"
                                                lineJoin="round"
                                            />
                                        ))
                                    }

                                    {
                                        konumluDuraklar.map(x => (
                                            <Marker
                                                key={x.ambarId}
                                                coordinate={{ latitude: x.lat as number, longitude: x.lon as number }}
                                                anchor={{ x: 0.5, y: 0.5 }}
                                                tracksViewChanges={isaretIzle}
                                                title={`${x.sira}. ${x.teslimFirmasi ?? 'Teslim noktası'}`}
                                                description={x.ilIlce ?? undefined}
                                            >
                                                <HaritaIsareti metin={String(x.sira)} renk={TESLIM_RENGI} />
                                            </Marker>
                                        ))
                                    }

                                    {
                                        baslangic && (
                                            <Marker
                                                key="yukleme"
                                                coordinate={baslangic}
                                                anchor={{ x: 0.5, y: 0.5 }}
                                                tracksViewChanges={isaretIzle}
                                                title={veri.baslangicAdi ?? 'Yükleme noktası'}
                                                description="Yükleme noktası"
                                                zIndex={10}
                                            >
                                                <HaritaIsareti metin="D" renk={YUKLEME_RENGI} />
                                            </Marker>
                                        )
                                    }
                                </MapView>
                            ) : (
                                <View style={s.orta}>
                                    <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center' }}>Haritada gösterilecek konum yok</Yazi>
                                </View>
                            )
                        }

                        <View style={s.panel}>
                            <View style={s.ozet}>
                                <View style={s.ozetKutu}>
                                    <Yazi tur="etiket">TOPLAM</Yazi>
                                    <Yazi tur="altBaslik">{kmMetni(veri.toplamKm)}</Yazi>
                                </View>
                                {
                                    (veri.toplamSureDk ?? 0) > 0 && (
                                        <View style={s.ozetKutu}>
                                            <Yazi tur="etiket">SÜRE</Yazi>
                                            <Yazi tur="altBaslik">{sureMetni(veri.toplamSureDk)}</Yazi>
                                        </View>
                                    )
                                }
                                <View style={s.ozetKutu}>
                                    <Yazi tur="etiket">DURAK</Yazi>
                                    <Yazi tur="altBaslik">{veri.duraklar.length}</Yazi>
                                </View>
                            </View>

                            <Ayrac />

                            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={s.liste}>
                                {
                                    (baslangic || veri.baslangicAdi) && (
                                        <View style={s.satir}>
                                            <ListeIsareti metin="D" renk={baslangic ? YUKLEME_RENGI : undefined} />
                                            <View style={{ flex: 1 }}>
                                                <Yazi tur="govdeKalin" satir={1}>{veri.baslangicAdi || 'Yükleme noktası'}</Yazi>
                                                <Yazi tur="kucuk" satir={1}>Yükleme noktası</Yazi>
                                            </View>
                                            {!baslangic && <Etiket metin="Konum yok" ton="gri" />}
                                        </View>
                                    )
                                }

                                {veri.duraklar.map(x => <DurakSatiri key={x.ambarId} durak={x} />)}
                            </ScrollView>
                        </View>
                    </View>
                )
            }
        </Layout>
    );
};

const DurakSatiri = ({ durak }: { durak: SeferGuzergahDurak }) => {
    const konumlu = konumVar(durak.lat, durak.lon);

    return (
        <View style={s.satir}>
            <ListeIsareti metin={String(durak.sira)} renk={konumlu ? TESLIM_RENGI : undefined} />
            <View style={{ flex: 1, gap: 2 }}>
                <Yazi tur="govdeKalin" satir={1}>{durak.teslimFirmasi || durak.refNo || 'Teslim noktası'}</Yazi>
                {durak.ilIlce ? <Yazi tur="kucuk" satir={1}>{durak.ilIlce}</Yazi> : null}
                {
                    (durak.elleIlkSira || !konumlu) && (
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                            {durak.elleIlkSira && <Etiket metin="İlk teslim" ton="amber" />}
                            {!konumlu && <Etiket metin="Konum yok" ton="gri" />}
                        </View>
                    )
                }
            </View>
            {konumlu && typeof durak.km === 'number' ? <Yazi tur="kucukKalin">{kmMetni(durak.km)}</Yazi> : null}
        </View>
    );
};

/** Haritadaki yuvarlak, beyaz cerceveli, numarali isaret. */
const HaritaIsareti = ({ metin, renk }: { metin: string, renk: string }) => (
    <View style={[s.haritaIsaret, { backgroundColor: renk }]} collapsable={false}>
        <Text style={s.haritaIsaretYazi}>{metin}</Text>
    </View>
);

/** Listedeki sira numarasi; konumsuz durak gri. */
const ListeIsareti = ({ metin, renk }: { metin: string, renk?: string }) => (
    <View style={[s.listeIsaret, { backgroundColor: renk ?? '#C9D0DB' }]}>
        <Text style={s.listeIsaretYazi}>{metin}</Text>
    </View>
);

const s = StyleSheet.create({
    orta: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    panel: { maxHeight: '45%', backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
    ozet: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    ozetKutu: { flex: 1, gap: 2 },
    liste: { paddingHorizontal: 16, paddingVertical: 8 },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.divider },
    haritaIsaret: { width: 30, height: 30, borderRadius: 99, borderWidth: 2, borderColor: c.white, alignItems: 'center', justifyContent: 'center' },
    haritaIsaretYazi: { color: c.white, fontSize: 13, fontWeight: '700' },
    listeIsaret: { width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
    listeIsaretYazi: { color: c.white, fontSize: 13, fontWeight: '700' },
});

export default MapScreen;
