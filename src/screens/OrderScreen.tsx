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
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import Card from '../components/Card';
import { ambarSetDeliveryDate, ambarSetDeliveryEndDate, ambarSetLoadDate, ambarSetLoadEndDate } from '../api/ambar';
import KanitFotograflari, { TeslimKisileri } from '../components/KanitFotograflari';
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
        var startAmbarVoyageResponse = await startAmbarVoyage({ id: _ambarVoyageId });
        onGetAmbarVoyageById(_ambarVoyageId);
    };

    const onEndAmbarVoyage = async (_ambarVoyageId: string) => {
        var control = data?.ambars?.find(x => !x.deliveryEndDate);

        if (control) {
            Alert.alert('Hata', 'Tüm yükler teslim edilmeden seferi bitiremezsiniz.');
            return;
        }

        var endAmbarVoyageResponse = await endAmbarVoyage({ id: _ambarVoyageId });
        onGetAmbarVoyageById(_ambarVoyageId);
    };

    const preSaveAsDraftIrsaliye = async (_ambarId: string, _ambarVoyageId: string) => {
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
        var location = await getCurrentLocation();

        var ambarSetLoadDateResponse = await ambarSetLoadDate({ ambarId: _ambarId, lat: location?.latitude, lon: location?.longitude });
        onGetAmbarVoyageById(_ambarVoyageId);
    };

    /**
     * "Yukleme Yapildi" artik dogrudan kaydetmez: once kanit ekrani acilir.
     * Yukleme kaniti cekilmeden tamamlanamaz; sunucu da kanitsiz istegi reddeder.
     */
    const onAmbarSetLoadEndDate = (_ambarVoyageId: string, _ambarId: string) => {
        setKanitEkrani({ ambarId: _ambarId, ambarVoyageId: _ambarVoyageId, mod: 'yukleme' });
    };

    const yuklemeyiTamamla = async (_ambarVoyageId: string, _ambarId: string) => {
        var location = await getCurrentLocation();

        var yanit = await ambarSetLoadEndDate({ ambarId: _ambarId, lat: location?.latitude, lon: location?.longitude });

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

    const teslimiTamamla = async (_ambarVoyageId: string, _ambarId: string, _teslim?: TeslimKisileri) => {
        var location = await getCurrentLocation();

        // Fotograflar onceden tek tek yuklendi; bu cagriya b64 gonderilmez. Teslim Eden / Alan siparise yazilir (4.3).
        var yanit = await ambarSetDeliveryEndDate({
            ambarId: _ambarId,
            lat: location?.latitude,
            lon: location?.longitude,
            shippingDeliverer: _teslim?.teslimEden || undefined,
            shippingReceiver: _teslim?.teslimAlan || undefined,
        });

        setKanitEkrani(undefined);
        onGetAmbarVoyageById(_ambarVoyageId);
    };

    const onAmbarSetDeliveryDate = async (_ambarVoyageId: string, _ambarId: string) => {
        var location = await getCurrentLocation();

        var ambarSetDeliveryDateResponse = await ambarSetDeliveryDate({ ambarId: _ambarId, lat: location?.latitude, lon: location?.longitude });
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

    return (
        <Layout title={(data?.refNo ?? '') + ' Yüklerim'} hasPadding={false} canGoBack>
            <Box flexGrow={1}>
                <ScrollView>
                    {
                        data?.ambars?.map((item, index) => (
                            <Box key={generateUUID()} overflow='hidden' mt={index == 0 ? 0 : 15}>
                                <Card p={0}>
                                    <Box p={15}>
                                        <Box flexDirection='row'>
                                            <Box flexGrow={1} justifyContent='center'>
                                                <Text fontWeight={'600'} color={theme.colors.muted} fontSize={theme.fontSizes.md}>{item.refNo}</Text>
                                            </Box>
                                            <Box justifyContent='center'>
                                                <Text fontWeight={'600'} color={theme.colors.blue} fontSize={theme.fontSizes.md}>{item.orderStatusName}</Text>
                                            </Box>
                                        </Box>

                                        <Box mt={15} mb={15} height={1} bg={theme.colors.border} />

                                        <Box flexDirection='row'>
                                            <Box mr={10}>
                                                <Box zIndex={1} position='absolute' mt={6} width={10} height={10} borderRadius={99} bg={theme.colors.blue} />
                                                <Box ml={4} flexGrow={1} width={2} bg={theme.colors.border} />
                                            </Box>
                                            <Box mb={15}>
                                                <Text fontWeight='600' fontSize={theme.fontSizes.sm} color={theme.colors.ink}>{item.loadingFirmCustomerName}</Text>
                                                <Text fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{item.loadingCountyName} • {item.loadingDistrictName}</Text>
                                            </Box>
                                        </Box>
                                        <Box flexDirection='row'>
                                            <Box mr={10}>
                                                <Box zIndex={1} position='absolute' mt={6} width={10} height={10} borderRadius={99} bg={theme.colors.green} />
                                                <Box ml={4} flexGrow={1} width={2} bg={theme.colors.border} />
                                            </Box>
                                            <Box>
                                                <Text fontWeight='600' fontSize={theme.fontSizes.sm} color={theme.colors.ink}>{item.deliverFirmCustomerName}</Text>
                                                <Text fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{item.deliverCountyName} • {item.deliverDistrictName}</Text>
                                            </Box>
                                        </Box>

                                        <Box mt={15} mb={15} height={1} bg={theme.colors.border} />

                                        <Box flexDirection='row'>
                                            <Box flex={1} justifyContent='center'>
                                                <Box flexDirection='row'>
                                                    <Box justifyContent='center'>
                                                        <Text fontSize={theme.fontSizes.xs} fontWeight='600' color={theme.colors.ink}>{formatWeight(sum(item.ambarProducts.map(x => x.weight ?? 0)))}</Text>
                                                    </Box>
                                                    {
                                                        data?.vehicleType2Name && (
                                                            <Box justifyContent='center'>
                                                                <Text fontSize={theme.fontSizes.xs} color={theme.colors.muted}> • {data.vehicleType2Name}</Text>
                                                            </Box>
                                                        )
                                                    }
                                                </Box>
                                            </Box>
                                            <Box flex={1} justifyContent='center'>
                                                <Text fontSize={theme.fontSizes.xs} fontWeight='600' color={theme.colors.ink}>{getDistanceKm(item.deliverFirmCustomerAddressLat ?? 0, item.deliverFirmCustomerAddressLon ?? 0, item.loadingFirmCustomerAddressLat ?? 0, item.loadingFirmCustomerAddressLon ?? 0).toFixed(2)} km</Text>
                                            </Box>
                                            <Box flex={1} justifyContent='center'>
                                                <Text textAlign='right' fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{item.createdDateStr}</Text>
                                            </Box>
                                        </Box>

                                        <Box mt={15} mb={15} height={1} bg={theme.colors.border} />

                                        <Box gap={15}>
                                            <Button onPress={() => navigation.navigate('Detail', { ambarId: item.ambarId })} pb={7.5} pt={7.5} fontSize={theme.fontSizes.sm} bg={theme.colors.blue} color={theme.colors.white} text='Detay' />

                                            {
                                                (!item.loadDate || !item.loadEndDate || !item.deliveryDate || !item.deliveryEndDate) && (
                                                    <Button
                                                        onPress={() => redirectToNavigation(item)}
                                                        pb={7.5}
                                                        pt={7.5}
                                                        fontSize={theme.fontSizes.sm}
                                                        bg={theme.colors.orange}
                                                        color={theme.colors.white}
                                                        text='Navigasyon'
                                                    />
                                                )
                                            }

                                            {
                                                (data.startDate && !data.endDate && !item.loadDate) && (
                                                    <Button
                                                        onPress={() => onAmbarSetLoadDate(data.ambarVoyageId, item.ambarId)}
                                                        pb={7.5}
                                                        pt={7.5}
                                                        fontSize={theme.fontSizes.sm}
                                                        bg={theme.colors.green}
                                                        color={theme.colors.white}
                                                        text='Yükleme Noktasına Varıldı'
                                                    />
                                                )
                                            }

                                            {
                                                (data.startDate && !data.endDate && item.loadDate && !item.loadEndDate) && (
                                                    <Button
                                                        onPress={() => onAmbarSetLoadEndDate(data.ambarVoyageId, item.ambarId)}
                                                        pb={7.5}
                                                        pt={7.5}
                                                        fontSize={theme.fontSizes.sm}
                                                        bg={theme.colors.green}
                                                        color={theme.colors.white}
                                                        text='Yükleme Yapıldı'
                                                    />
                                                )
                                            }

                                            {
                                                (data.startDate && !data.endDate && item.loadEndDate && !item.deliveryDate) && (
                                                    <Button
                                                        onPress={() => onAmbarSetDeliveryDate(data.ambarVoyageId, item.ambarId)}
                                                        pb={7.5}
                                                        pt={7.5}
                                                        fontSize={theme.fontSizes.sm}
                                                        bg={theme.colors.green}
                                                        color={theme.colors.white}
                                                        text='Boşaltma Noktasına Varıldı'
                                                    />
                                                )
                                            }

                                            {
                                                (data.startDate && !data.endDate && item.deliveryDate && !item.deliveryEndDate) && (
                                                    <Button
                                                        onPress={() => onDeliver(data.ambarVoyageId, item.ambarId)}
                                                        pb={7.5}
                                                        pt={7.5}
                                                        fontSize={theme.fontSizes.sm}
                                                        bg={theme.colors.green}
                                                        color={theme.colors.white}
                                                        text='Teslim Edildi'
                                                    />
                                                )
                                            }

                                            {
                                                !(item.isSendGib === true) && (
                                                    <Button
                                                        onPress={() => preSaveAsDraftIrsaliye(item.ambarId, data.ambarVoyageId)}
                                                        pb={7.5}
                                                        pt={7.5}
                                                        fontSize={theme.fontSizes.sm}
                                                        bg={theme.colors.ink}
                                                        color={theme.colors.white}
                                                        text="GİB'e Gönder"
                                                    />
                                                )
                                            }
                                        </Box>
                                    </Box>
                                </Card>
                            </Box>
                        ))
                    }
                </ScrollView>
            </Box>

            {
                (data && (!data.startDate || !data.endDate)) && (
                    <Box p={15} bg={theme.colors.bg} borderTopWidth={1} borderColor={theme.colors.border}>
                        <Box flexDirection='row'>
                            <Box /*mr={15}*/ flexGrow={1} justifyContent='center'>
                                {
                                    (!data.startDate && !data.endDate) && (
                                        <Button
                                            onPress={() => onStartAmbarVoyage(data?.ambarVoyageId ?? '')}
                                            color={theme.colors.white}
                                            bg={theme.colors.blue}
                                            text='Sefere Başla'
                                        />
                                    )
                                }
                                {
                                    (data.startDate && !data.endDate) && (
                                        <Button
                                            onPress={() => onEndAmbarVoyage(data?.ambarVoyageId ?? '')}
                                            color={theme.colors.white}
                                            bg={theme.colors.red}
                                            text='Seferi Bitir'
                                        />
                                    )
                                }
                            </Box>
                            {/* <Box justifyContent='center'>
                                <Button
                                    pr={15}
                                    pl={15}
                                    onPress={() => navigation.navigate('Map', { ambarVoyageId: data.ambarVoyageId ?? '' })}
                                    color={theme.colors.white}
                                    bg={theme.colors.blue}
                                    icon={<Map size={theme.fontSizes['2xl']} color={theme.colors.white} />}
                                />
                            </Box> */}
                        </Box>
                    </Box>
                )
            }

            <KanitFotograflari
                isShown={kanitEkrani !== undefined}
                ambarId={kanitEkrani?.ambarId}
                mod={kanitEkrani?.mod ?? "yukleme"}
                onTamamla={(teslim) => {
                    if (!kanitEkrani)
                        return;

                    if (kanitEkrani.mod === "yukleme")
                        yuklemeyiTamamla(kanitEkrani.ambarVoyageId, kanitEkrani.ambarId);
                    else
                        teslimiTamamla(kanitEkrani.ambarVoyageId, kanitEkrani.ambarId, teslim);
                }}
                onKapat={() => setKanitEkrani(undefined)}
            />
        </Layout >
    );
}