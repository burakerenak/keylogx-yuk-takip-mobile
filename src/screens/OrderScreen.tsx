import React, { useCallback, useState } from 'react';
import Layout from '../layouts/Layout';
import Text from '../components/Text';
import Box from '../components/Box';
import { theme } from '../theme/theme';
import { formatWeight, sum } from '../utils/numberUtils';
import { generateUUID, getDistanceKm } from '../utils/commonUtils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/types';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { GetAmbarVoyageByIdResponse, GetAmbarVoyageByIdResponseAmbar } from '../types/ambarVoyage.types';
import { endAmbarVoyage, getAmbarVoyageById, startAmbarVoyage } from '../api/ambarVoyage';
import Button from '../components/Button';
import { ArrowRight, LucideArrowBigRight, Map } from 'lucide-react-native';
import ScrollView from '../components/ScrollView';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { saveAsDraftIrsaliye } from '../api/uyumsoft';
import { Alert, Linking, PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { Dugme, Etiket, EtiketTonu, Kart, Yazi } from '../ui';
import Card from '../components/Card';
import { ambarSetDeliveryDate, ambarSetDeliveryEndDate, ambarSetLoadDate, ambarSetLoadEndDate } from '../api/ambar';
import KanitFotograflari from '../components/KanitFotograflari';
import Geolocation from '@react-native-community/geolocation';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

export default function OrderScreen() {
    const route = useRoute<RouteProp<AppStackParamList, 'Order'>>();

    const [data, setData] = useState<GetAmbarVoyageByIdResponse | undefined>(undefined);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    useFocusEffect(
        useCallback(() => {
            onGetAmbarVoyageById(route.params.ambarVoyageId);

            return () => {
                // İstersen temizleme işlemleri
            };
        }, [])
    );

    const onGetAmbarVoyageById = async (_ambarVoyageId: string) => {
        var getAmbarVoyageByIdResponse = await getAmbarVoyageById({ id: _ambarVoyageId });
        setData(getAmbarVoyageByIdResponse);
    };

    const onStartAmbarVoyage = async (_ambarVoyageId: string) => {
        try {
            await startAmbarVoyage({ id: _ambarVoyageId });
        } catch {
            // Mesaji baglanti katmani gosterir.
        }

        onGetAmbarVoyageById(_ambarVoyageId);
    };

    const onEndAmbarVoyage = async (_ambarVoyageId: string) => {
        var control = data?.ambars?.find(x => !x.deliveryEndDate);

        if (control) {
            Alert.alert('Hata', 'Tüm yükler teslim edilmeden seferi bitiremezsiniz.');
            return;
        }

        try {
            await endAmbarVoyage({ id: _ambarVoyageId });
        } catch {
            // Mesaji baglanti katmani gosterir.
        }

        onGetAmbarVoyageById(_ambarVoyageId);
    };

    const preSaveAsDraftIrsaliye = async (_ambarId: string, _ambarVoyageId: string) => {
        // 4.3.1 (Burak): yuklendi olmadan e-irsaliye gonderilemez; kullanici Tamam deyip ekrana doner.
        if (!data?.ambars?.find(x => x.ambarId === _ambarId)?.loadEndDate) {
            Alert.alert('Uyarı', "Yükleme yapılmadan GİB'e gönderim yapamazsınız!", [{ text: 'Tamam' }]);
            return;
        }

        Alert.alert(
            "Emin Misiniz?",          // Title of the alert
            "", // Message body
            [
                {
                    text: "Hayır",
                    onPress: () => { },
                    style: "cancel"        // iOS styling for the secondary action
                },
                {
                    text: "Evet",
                    onPress: () => onSaveAsDraftIrsaliye(_ambarId, _ambarVoyageId) // Trigger your logic here
                }
            ],
            { cancelable: true }       // Allows tapping outside the dialog to dismiss on Android
        );
    }

    const onSaveAsDraftIrsaliye = async (_ambarId: string, _ambarVoyageId: string) => {
        var saveAsDraftIrsaliyeResponse = await saveAsDraftIrsaliye({ ambarId: _ambarId, sendToGib: true });

        if (saveAsDraftIrsaliyeResponse.isSucceded) {
            Alert.alert("Başarılı", saveAsDraftIrsaliyeResponse.message);
            onGetAmbarVoyageById(_ambarVoyageId);
        }
        else {
            Alert.alert("Hata", saveAsDraftIrsaliyeResponse.message);
        }
    }

    // Kanit fotografi ekrani. Acikken hangi siparis ve hangi adim icin acildigini tutar.
    const [kanitEkrani, setKanitEkrani] = useState<{ ambarId: string, ambarVoyageId: string, mod: 'yukleme' | 'teslim' } | undefined>(undefined);

    const onAmbarSetLoadDate = async (_ambarVoyageId: string, _ambarId: string) => {
        try {
            var location = await getCurrentLocation();

            await ambarSetLoadDate({ ambarId: _ambarId, lat: location?.latitude, lon: location?.longitude });
        } catch {
            // Sunucunun mesajini (or. "Yukleme adresine yakin degilsiniz: telefonunuz 902 m uzakta") baglanti katmani gosterir.
        }

        onGetAmbarVoyageById(_ambarVoyageId);
    };

    /**
     * "Yukleme Yapildi" artik dogrudan kaydetmez: once kanit ekrani acilir.
     * Yukleme kaniti cekilmeden tamamlanamaz; sunucu da kanitsiz istegi reddeder.
     */
    const onAmbarSetLoadEndDate = (_ambarVoyageId: string, _ambarId: string) => {
        setKanitEkrani({ ambarId: _ambarId, ambarVoyageId: _ambarVoyageId, mod: 'yukleme' });
    };

    const yuklemeyiTamamla = async (_ambarVoyageId: string, _ambarId: string, _teslimEden: string) => {
        try {
            var location = await getCurrentLocation();

            // 4.3: Teslim Eden siparisin web ekranindaki alana yazilir.
            await ambarSetLoadEndDate({ ambarId: _ambarId, lat: location?.latitude, lon: location?.longitude, shippingDeliverer: _teslimEden });
        } catch {
            // Reddedildi: mesaj gosterildi, kanit ekrani acik kalir, surucu tekrar deneyebilir.
            return;
        }

        setKanitEkrani(undefined);
        onGetAmbarVoyageById(_ambarVoyageId);

        // Surucu e-irsaliyeyi GIB'e gonderemez; gonderim web ekranindan yapiliyor.
        // Yine de hatirlatma cikar, ayrica operasyon listesinde isaret gorunur.
        Alert.alert(
            "İrsaliye'yi GİB'e göndermelisiniz",
            'Yükleme tamamlandı ve fotoğrafları kaydedildi. E-irsaliyenin GİB\'e gönderilmesi gerekiyor.',
            [{ text: 'Tamam' }],
        );
    };

    const teslimiTamamla = async (_ambarVoyageId: string, _ambarId: string, _teslimAlan: string) => {
        try {
            var location = await getCurrentLocation();

            // Fotograflar onceden tek tek yuklendi; bu cagriya b64 gonderilmez. 4.3: Teslim Alan siparise yazilir.
            await ambarSetDeliveryEndDate({ ambarId: _ambarId, lat: location?.latitude, lon: location?.longitude, shippingReceiver: _teslimAlan });
        } catch {
            return;
        }

        setKanitEkrani(undefined);
        onGetAmbarVoyageById(_ambarVoyageId);
    };

    const onAmbarSetDeliveryDate = async (_ambarVoyageId: string, _ambarId: string) => {
        try {
            var location = await getCurrentLocation();

            await ambarSetDeliveryDate({ ambarId: _ambarId, lat: location?.latitude, lon: location?.longitude });
        } catch {
            // Mesaji baglanti katmani gosterir.
        }

        onGetAmbarVoyageById(_ambarVoyageId);
    };

    /**
     * "Teslim Edildi" artik tek fotograf + tur secimi yerine kanit ekranini acar.
     * Eski akis (showSinglePicker + selectImage) kaldirildi.
     */
    const onDeliver = (_ambarVoyageId: string, _ambarId: string) => {
        setKanitEkrani({ ambarId: _ambarId, ambarVoyageId: _ambarVoyageId, mod: 'teslim' });
    }

    const redirectToNavigation = (item: GetAmbarVoyageByIdResponseAmbar) => {
        if (!item.loadDate) {
            var lat = item.loadingFirmCustomerAddressLat;
            var lon = item.loadingFirmCustomerAddressLon;

            openNavigation(lat, lon);
        }
        else if (!item.deliveryDate) {
            var lat = item.deliverFirmCustomerAddressLat;
            var lon = item.deliverFirmCustomerAddressLon;

            openNavigation(lat, lon);
        }
    }

    const openNavigation = async (lat: number, lon: number) => {
        try {
            const yandexNaviUrl = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;

            const googleUrl = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${lat},${lon}`;

            // Önce YandexNavi Maps var mı kontrol et
            const canOpenYandexNavi = await Linking.canOpenURL(yandexNaviUrl);

            if (canOpenYandexNavi) {
                await Linking.openURL(yandexNaviUrl);
                return;
            }

            // Yandex yoksa Google Maps
            await Linking.openURL(googleUrl);

        } catch (error) {
            Alert.alert('Hata', 'Navigasyon açılamadı.');
        }
    };

    const getCurrentLocation = async (): Promise<{
        latitude: number;
        longitude: number;
        accuracy: number;
    } | undefined> => {
        try {
            if (Platform.OS === 'android') {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ]);

                if (!(result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED && result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED))
                    return undefined;
            }
            else {
                const result = await request(
                    PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
                );

                var granted = result === RESULTS.GRANTED;

                if (!granted)
                    return undefined;
            }

            return await new Promise(resolve => {
                Geolocation.getCurrentPosition(
                    position => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                        });
                    },
                    () => {
                        resolve(undefined);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 0,
                    },
                );
            });
        } catch {
            return undefined;
        }
    };

    const durumTonu = (item: GetAmbarVoyageByIdResponseAmbar): EtiketTonu =>
        item.deliveryEndDate ? 'yesil' : item.loadEndDate ? 'turkuaz' : item.loadDate ? 'mavi' : 'amber';

    return (
        <Layout title={(data?.refNo ?? '') + ' Yüklerim'} hasPadding={false} canGoBack>
            <Box flexGrow={1}>
                <ScrollView>
                    {
                        data?.ambars?.map((item, index) => {
                            const surer = data.startDate && !data.endDate;

                            return (
                                <Kart key={item.ambarId} style={{ marginTop: index == 0 ? 0 : 14, gap: 12 }}>
                                    <View style={st.ust}>
                                        <Yazi tur="govdeKalin" style={{ fontWeight: '700' }}>{item.refNo}</Yazi>
                                        {item.orderStatusName ? <Etiket metin={item.orderStatusName} ton={durumTonu(item)} /> : null}
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <View style={{ alignItems: 'center', paddingTop: 5 }}>
                                            <View style={[st.nokta, { backgroundColor: theme.colors.blue }]} />
                                            <View style={st.cizgi} />
                                            <View style={[st.nokta, { backgroundColor: theme.colors.teal }]} />
                                        </View>
                                        <View style={{ flex: 1, gap: 10 }}>
                                            <View>
                                                <Yazi tur="govdeKalin" satir={1}>{item.loadingFirmCustomerName}</Yazi>
                                                <Yazi tur="kucuk" satir={1}>{item.loadingCountyName} • {item.loadingDistrictName}</Yazi>
                                            </View>
                                            <View>
                                                <Yazi tur="govdeKalin" satir={1}>{item.deliverFirmCustomerName}</Yazi>
                                                <Yazi tur="kucuk" satir={1}>{item.deliverCountyName} • {item.deliverDistrictName}</Yazi>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={st.bilgi}>
                                        <Yazi tur="kucukKalin">{formatWeight(sum(item.ambarProducts.map(x => x.weight ?? 0)))}{(data?.vehicleTypeName || data?.vehicleType2Name) ? ' · ' + (data?.vehicleTypeName || data?.vehicleType2Name) : ''}</Yazi>
                                        <Yazi tur="kucukKalin">{getDistanceKm(item.deliverFirmCustomerAddressLat ?? 0, item.deliverFirmCustomerAddressLon ?? 0, item.loadingFirmCustomerAddressLat ?? 0, item.loadingFirmCustomerAddressLon ?? 0).toFixed(1)} km</Yazi>
                                        <Yazi tur="kucuk">{item.createdDateStr}</Yazi>
                                    </View>

                                    <View style={{ gap: 10 }}>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <Dugme kucuk tur="cizgili" metin="Detay" onPress={() => navigation.navigate('Detail', { ambarId: item.ambarId })} style={{ flex: 1 }} />
                                            {
                                                (!item.loadDate || !item.loadEndDate || !item.deliveryDate || !item.deliveryEndDate) && (
                                                    <Dugme kucuk tur="cizgili" metin="Navigasyon" ikon={<Navigation size={18} color={theme.colors.ink} />} onPress={() => redirectToNavigation(item)} style={{ flex: 1 }} />
                                                )
                                            }
                                        </View>

                                        {surer && !item.loadDate && <Dugme tur="mavi" metin="Yükleme Noktasına Varıldı" onPress={() => onAmbarSetLoadDate(data.ambarVoyageId, item.ambarId)} />}
                                        {surer && item.loadDate && !item.loadEndDate && <Dugme tur="mavi" metin="Yükleme Yapıldı" onPress={() => onAmbarSetLoadEndDate(data.ambarVoyageId, item.ambarId)} />}
                                        {surer && item.loadEndDate && !item.deliveryDate && <Dugme tur="turkuaz" metin="Boşaltma Noktasına Varıldı" onPress={() => onAmbarSetDeliveryDate(data.ambarVoyageId, item.ambarId)} />}
                                        {surer && item.deliveryDate && !item.deliveryEndDate && <Dugme tur="turkuaz" metin="Teslim Edildi" onPress={() => onDeliver(data.ambarVoyageId, item.ambarId)} />}
                                        {!(item.isSendGib === true) && <Dugme kucuk tur="mor" metin="GİB'e Gönder" onPress={() => preSaveAsDraftIrsaliye(item.ambarId, data.ambarVoyageId)} />}
                                    </View>
                                </Kart>
                            );
                        })
                    }
                </ScrollView>
            </Box>

            {
                (data && (!data.startDate || !data.endDate)) && (
                    <View style={st.alt}>
                        {(!data.startDate && !data.endDate) && <Dugme tur="mavi" metin="Sefere Başla" onPress={() => onStartAmbarVoyage(data?.ambarVoyageId ?? '')} />}
                        {(data.startDate && !data.endDate) && <Dugme tur="tehlike" metin="Seferi Bitir" onPress={() => onEndAmbarVoyage(data?.ambarVoyageId ?? '')} />}
                    </View>
                )
            }

            <KanitFotograflari
                isShown={kanitEkrani !== undefined}
                ambarId={kanitEkrani?.ambarId}
                mod={kanitEkrani?.mod ?? "yukleme"}
                onTamamla={(kisi) => {
                    if (!kanitEkrani)
                        return;

                    if (kanitEkrani.mod === "yukleme")
                        yuklemeyiTamamla(kanitEkrani.ambarVoyageId, kanitEkrani.ambarId, kisi);
                    else
                        teslimiTamamla(kanitEkrani.ambarVoyageId, kanitEkrani.ambarId, kisi);
                }}
                onKapat={() => setKanitEkrani(undefined)}
            />
        </Layout >
    );
}

const st = StyleSheet.create({
    ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    nokta: { width: 9, height: 9, borderRadius: 99 },
    cizgi: { width: 2, flex: 1, minHeight: 18, backgroundColor: '#D5DAE3', marginVertical: 2 },
    bilgi: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.divider },
    alt: { padding: 16, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
});
