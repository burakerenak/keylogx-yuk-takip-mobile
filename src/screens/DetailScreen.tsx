import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Layout from "../layouts/Layout";
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { AppStackParamList } from "../navigation/types";
import { GetAmbarByIdResponse } from "../types/ambar.types";
import { theme } from "../theme/theme";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getAmbarById } from "../api/ambar";
import { formatWeight, sum, toNumber } from "../utils/numberUtils";
import { getDistanceKm } from "../utils/commonUtils";
import { Phone } from "lucide-react-native";
import { telefonAra, telefonAramaAdresi } from "../utils/telefon";
import { BilgiSatiri, Dugme, Kart, Yazi } from "../ui";

const c = theme.colors;

/** Firma bilgisinin altinda yetkili ad soyad ve telefonu; "Ara"ya dokununca arama acilir (4.2, 4.3'te yeni gorunum). */
const FirmaYetkilisi = ({ adSoyad, telefon }: { adSoyad?: string | null, telefon?: string | null }) => {
    if (!adSoyad && !telefon)
        return null;

    const aranabilir = !!telefonAramaAdresi(telefon);

    return (
        <View style={s.yetkili}>
            <View style={{ flex: 1 }}>
                {adSoyad ? <Yazi tur="kucukKalin" satir={1}>Yetkili: {adSoyad}</Yazi> : null}
                <Yazi tur="kucuk" satir={1}>{telefon || 'Telefon: —'}</Yazi>
            </View>
            {
                aranabilir && (
                    <TouchableOpacity onPress={() => telefonAra(telefon)} style={s.ara} accessibilityLabel="Yetkiliyi ara">
                        <Phone size={16} color={c.greenDark} />
                        <Text style={s.araYazi}>Ara</Text>
                    </TouchableOpacity>
                )
            }
        </View>
    );
}

/** Rota kartindaki bir durak (Y: yukleme, T: teslim). */
const Durak = ({ harf, renk, zemin, firma, adres, ilce, yetkili, telefon }: {
    harf: string, renk: string, zemin: string, firma?: string, adres?: string, ilce?: string, yetkili?: string | null, telefon?: string | null
}) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[s.harf, { backgroundColor: zemin }]}><Text style={[s.harfYazi, { color: renk }]}>{harf}</Text></View>
        <View style={{ flex: 1, gap: 3 }}>
            <Yazi tur="govdeKalin" style={{ fontWeight: '700' }}>{firma}</Yazi>
            {adres ? <Yazi tur="kucuk">{adres}</Yazi> : null}
            {ilce ? <Yazi tur="kucuk">{ilce}</Yazi> : null}
            <FirmaYetkilisi adSoyad={yetkili} telefon={telefon} />
        </View>
    </View>
);

const Kutu = ({ etiket, deger }: { etiket: string, deger?: string }) => (
    <View style={s.kutu}>
        <Yazi tur="kucukKalin" style={{ color: c.muted, fontSize: 12 }}>{etiket}</Yazi>
        <Yazi tur="govdeKalin" style={{ fontSize: 17, fontWeight: '700' }} satir={1}>{deger || '—'}</Yazi>
    </View>
);

/**
 * Siparis detayi (4.3, 09.10.2026): rota + yetkililer, Agirlik / Arac Cinsi / Mesafe / Yukleme Saati, yuk detayi.
 * "Arac" bolumu kaldirildi (plaka - dorse Gorevlerim'de); Tonaj -> Agirlik, Kasa Tipi -> Arac Cinsi.
 */
const DetailScreen = () => {
    const route = useRoute<RouteProp<AppStackParamList, 'Detail'>>();

    const [data, setData] = useState<GetAmbarByIdResponse | undefined>(undefined);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    useFocusEffect(
        useCallback(() => {
            onGetAmbarById(route.params.ambarId);
        }, [])
    );

    const onGetAmbarById = async (_ambarId: string) => {
        try {
            setData(await getAmbarById({ id: _ambarId }));
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        }
    };

    const km = data ? getDistanceKm(data.deliverFirmCustomerAddressLat ?? 0, data.deliverFirmCustomerAddressLon ?? 0, data.loadingFirmCustomerAddressLat ?? 0, data.loadingFirmCustomerAddressLon ?? 0) : 0;

    return (
        <Layout title={(data?.refNo ?? '') + ' Detayları'} canGoBack hasPadding={false}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}>
                {
                    data && (
                        <React.Fragment>
                            {data.orderStatusName ? <Yazi tur="kucukKalin" style={{ color: c.blueDark }}>{data.orderStatusName}</Yazi> : null}

                            <Kart style={{ gap: 14 }}>
                                <Durak
                                    harf="Y" renk={c.blueDark} zemin={c.blueSoft}
                                    firma={data.loadingFirmCustomerName}
                                    adres={data.loadingFirmCustomerAddressText}
                                    ilce={[data.loadingCountyName, data.loadingDistrictName].filter(x => x).join(' • ')}
                                    yetkili={data.loadingFirmAuthorizedPersonName}
                                    telefon={data.loadingFirmAuthorizedPersonPhone}
                                />
                                <View style={s.ayrac} />
                                <Durak
                                    harf="T" renk={c.tealDark} zemin={c.tealSoft}
                                    firma={data.deliverFirmCustomerName}
                                    adres={data.deliverFirmCustomerAddressText}
                                    ilce={[data.deliverCountyName, data.deliverDistrictName].filter(x => x).join(' • ')}
                                    yetkili={data.deliverFirmAuthorizedPersonName}
                                    telefon={data.deliverFirmAuthorizedPersonPhone}
                                />
                            </Kart>

                            <View style={s.izgara}>
                                <Kutu etiket="Ağırlık" deger={formatWeight(sum(data.ambarProducts.map(x => toNumber(x.weight) ?? 0)))} />
                                <Kutu etiket="Araç Cinsi" deger={data.ambarVoyage?.vehicleTypeName || data.ambarVoyage?.vehicleType2Name} />
                                <Kutu etiket="Mesafe" deger={`${km.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`} />
                                <Kutu etiket="Yükleme Saati" deger={data.loadDateStr || undefined} />
                            </View>

                            {
                                data.ambarProducts.length > 0 && (
                                    <Kart style={{ gap: 4 }}>
                                        <Yazi tur="etiket">YÜK DETAYI</Yazi>
                                        {
                                            data.ambarProducts.map((item, index) => (
                                                <View key={index} style={index > 0 ? s.urunAyrac : null}>
                                                    <BilgiSatiri etiket="Kap cinsi" deger={item.potTypeName} />
                                                    <BilgiSatiri etiket="Adet" deger={item.quantity != null ? String(item.quantity) : undefined} />
                                                    <BilgiSatiri etiket="Ürün" deger={item.product} />
                                                    <BilgiSatiri etiket="Açıklama" deger={item.description} son />
                                                    {
                                                        // Guncelle yukleme noktasina varistan itibaren acik (10.10.2026); varis kaydi olmayan eski siparislerde yukleme tarihi.
                                                        (data?.ambarVoyage?.startDate && (data.loadArrivalDate || data.loadDate)) && (
                                                            <Dugme kucuk tur="yumusak" metin="Güncelle" onPress={() => navigation.navigate('UpdateProduct', { ambar: data, ambarProduct: item })} style={{ marginTop: 8 }} />
                                                        )
                                                    }
                                                </View>
                                            ))
                                        }
                                    </Kart>
                                )
                            }
                        </React.Fragment>
                    )
                }
            </ScrollView>
        </Layout>
    )
}

const s = StyleSheet.create({
    yetkili: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    ara: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: c.greenSoft },
    araYazi: { fontSize: 14, fontWeight: '700', color: c.greenDark },
    harf: { width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
    harfYazi: { fontSize: 12, fontWeight: '700' },
    ayrac: { height: 1, backgroundColor: c.divider },
    izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    kutu: { width: '48%', flexGrow: 1, backgroundColor: c.white, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, gap: 4 },
    urunAyrac: { borderTopWidth: 1, borderTopColor: c.border, marginTop: 10, paddingTop: 4 },
});

export default DetailScreen;
