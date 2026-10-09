import React, { useCallback, useEffect, useState } from "react";
import Text from "../components/Text"
import Layout from "../layouts/Layout";
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { AppStackParamList } from "../navigation/types";
import { GetAmbarByIdResponse } from "../types/ambar.types";
import Box from "../components/Box";
import { theme } from "../theme/theme";
import Card from "../components/Card";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getAmbarById } from "../api/ambar";
import { formatWeight, sum, toNumber } from "../utils/numberUtils";
import { getDistanceKm } from "../utils/commonUtils";
import ScrollView from "../components/ScrollView";
import Button from "../components/Button";
import { Phone } from "lucide-react-native";
import { telefonAra, telefonAramaAdresi } from "../utils/telefon";

/** Firma bilgisinin altinda yetkili ad soyad ve telefonu; telefona dokununca arama acilir (09.10.2026). */
const FirmaYetkilisi = ({ adSoyad, telefon }: { adSoyad?: string | null, telefon?: string | null }) => {
    if (!adSoyad && !telefon)
        return null;

    const aranabilir = !!telefonAramaAdresi(telefon);

    return (
        <Box mt={6}>
            {adSoyad ? <Text fontSize={theme.fontSizes.xs} color={theme.colors.ink}>Yetkili: {adSoyad}</Text> : null}
            <Box mt={4} flexDirection="row" alignItems="center" onPress={aranabilir ? () => telefonAra(telefon) : undefined}>
                {aranabilir && (
                    <Box mr={6} width={26} height={26} borderRadius={99} bg={theme.colors.green} alignItems="center" justifyContent="center">
                        <Phone size={14} color={theme.colors.white} />
                    </Box>
                )}
                <Text fontSize={theme.fontSizes.sm} fontWeight="600" color={aranabilir ? theme.colors.blue : theme.colors.muted}>{telefon || "Telefon: —"}</Text>
            </Box>
        </Box>
    )
}

const DetailScreen = () => {
    const route = useRoute<RouteProp<AppStackParamList, 'Detail'>>();

    const [data, setData] = useState<GetAmbarByIdResponse | undefined>(undefined);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    useFocusEffect(
        useCallback(() => {
            onGetAmbarById(route.params.ambarId);

            return () => {
                // İstersen temizleme işlemleri
            };
        }, [])
    );

    const onGetAmbarById = async (_ambarId: string) => {
        var getAmbarByIdResponse = await getAmbarById({ id: _ambarId });
        setData(getAmbarByIdResponse);
    };

    return (
        <Layout title={(data?.refNo ?? '') + ' Detayları'} canGoBack hasPadding={false}>
            <ScrollView>
                {
                    data && (
                        <React.Fragment>
                            <Card>
                                <Box flexDirection='row'>
                                    <Box mr={10}>
                                        <Box zIndex={1} position='absolute' mt={6} width={10} height={10} borderRadius={99} bg={theme.colors.blue} />
                                        <Box ml={4} flexGrow={1} width={2} bg={theme.colors.border} />
                                    </Box>
                                    <Box mb={15}>
                                        <Text fontWeight='600' fontSize={theme.fontSizes.sm} color={theme.colors.ink}>{data.loadingFirmCustomerName}</Text>
                                        <Text fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{data.loadingFirmCustomerAddressText}</Text>
                                        <Text fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{data.loadingCountyName} • {data.loadingDistrictName}</Text>
                                        <FirmaYetkilisi adSoyad={data.loadingFirmAuthorizedPersonName} telefon={data.loadingFirmAuthorizedPersonPhone} />
                                    </Box>
                                </Box>
                                <Box flexDirection='row'>
                                    <Box mr={10}>
                                        <Box zIndex={1} position='absolute' mt={6} width={10} height={10} borderRadius={99} bg={theme.colors.green} />
                                        <Box ml={4} flexGrow={1} width={2} bg={theme.colors.border} />
                                    </Box>
                                    <Box>
                                        <Text fontWeight='600' fontSize={theme.fontSizes.sm} color={theme.colors.ink}>{data.deliverFirmCustomerName}</Text>
                                        <Text fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{data.deliverFirmCustomerAddressText}</Text>
                                        <Text fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{data.deliverCountyName} • {data.deliverDistrictName}</Text>
                                        <FirmaYetkilisi adSoyad={data.deliverFirmAuthorizedPersonName} telefon={data.deliverFirmAuthorizedPersonPhone} />
                                    </Box>
                                </Box>
                            </Card>

                            <Card mt={15}>
                                <Text fontSize={theme.fontSizes.sm} fontWeight="700" color={theme.colors.muted}>TOPLAM YÜK BİLGİSİ</Text>

                                <Box mt={15}>
                                    <Box pt={8} pb={8} borderBottomWidth={1} borderTopWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                        <Box flexGrow={1} justifyContent="center">
                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Tonaj</Text>
                                        </Box>
                                        <Box justifyContent="center">
                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{formatWeight(sum(data.ambarProducts.map(x => toNumber(x.weight) ?? 0)))}</Text>
                                        </Box>
                                    </Box>
                                    <Box pt={8} pb={8} borderBottomWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                        <Box flexGrow={1} justifyContent="center">
                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Kasa Tipi</Text>
                                        </Box>
                                        <Box justifyContent="center">
                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{data.ambarVoyage?.vehicleType2Name}</Text>
                                        </Box>
                                    </Box>
                                    <Box pt={8} pb={8} borderBottomWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                        <Box flexGrow={1} justifyContent="center">
                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Mesafe</Text>
                                        </Box>
                                        <Box justifyContent="center">
                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{getDistanceKm(data.deliverFirmCustomerAddressLat ?? 0, data.deliverFirmCustomerAddressLon ?? 0, data.loadingFirmCustomerAddressLat ?? 0, data.loadingFirmCustomerAddressLon ?? 0).toFixed(2)} km</Text>
                                        </Box>
                                    </Box>
                                    <Box pt={8} borderColor={theme.colors.border} flexDirection="row">
                                        <Box flexGrow={1} justifyContent="center">
                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Yükleme Saati</Text>
                                        </Box>
                                        <Box justifyContent="center">
                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{data.createdDate}</Text>
                                        </Box>
                                    </Box>
                                </Box>
                            </Card>

                            <Card mt={15}>
                                <Text fontSize={theme.fontSizes.sm} fontWeight="700" color={theme.colors.muted}>ARAÇ</Text>

                                <Box mt={15}>
                                    <Box pt={8} pb={8} borderBottomWidth={1} borderTopWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                        <Box flexGrow={1} justifyContent="center">
                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Plaka</Text>
                                        </Box>
                                        <Box justifyContent="center">
                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{data.ambarVoyage?.vehicleName}</Text>
                                        </Box>
                                    </Box>
                                    <Box pt={8} borderColor={theme.colors.border} flexDirection="row">
                                        <Box flexGrow={1} justifyContent="center">
                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Çekici</Text>
                                        </Box>
                                        <Box justifyContent="center">
                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{data.ambarVoyage?.trailerName}</Text>
                                        </Box>
                                    </Box>
                                </Box>
                            </Card>


                            {
                                data.ambarProducts.length > 0 && (
                                    <Card mt={15}>
                                        <Text fontSize={theme.fontSizes.sm} fontWeight="700" color={theme.colors.muted}>DETAY YÜK BİLGİSİ</Text>

                                        {
                                            data.ambarProducts.map((item, index) =>
                                                <Card mt={15}>
                                                    <Box pb={8} borderBottomWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                                        <Box flexGrow={1} justifyContent="center">
                                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Kap Cinsi</Text>
                                                        </Box>
                                                        <Box justifyContent="center">
                                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{item.potTypeName}</Text>
                                                        </Box>
                                                    </Box>
                                                    <Box pt={8} pb={8} borderBottomWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                                        <Box flexGrow={1} justifyContent="center">
                                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Adet</Text>
                                                        </Box>
                                                        <Box justifyContent="center">
                                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{item.quantity}</Text>
                                                        </Box>
                                                    </Box>
                                                    <Box pt={8} pb={8} borderBottomWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                                        <Box flexGrow={1} justifyContent="center">
                                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Ürün</Text>
                                                        </Box>
                                                        <Box justifyContent="center">
                                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{item.product}</Text>
                                                        </Box>
                                                    </Box>
                                                    <Box pt={8} pb={8} borderBottomWidth={1} borderColor={theme.colors.border} flexDirection="row">
                                                        <Box flexGrow={1} justifyContent="center">
                                                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.md}>Açıklama</Text>
                                                        </Box>
                                                        <Box justifyContent="center">
                                                            <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{item.description}</Text>
                                                        </Box>
                                                    </Box>

                                                    {
                                                        (data?.ambarVoyage?.startDate && data.loadDate) && (
                                                            <Box pt={8}>
                                                                <Button onPress={() => navigation.navigate('UpdateProduct', { ambar: data, ambarProduct: item })} pb={7.5} pt={7.5} fontSize={theme.fontSizes.sm} bg={theme.colors.blue} color={theme.colors.white} text='Güncelle' />
                                                            </Box>
                                                        )
                                                    }
                                                </Card>
                                            )
                                        }
                                    </Card>
                                )
                            }
                        </React.Fragment>
                    )
                }
            </ScrollView>
        </Layout>
    )
}

export default DetailScreen;