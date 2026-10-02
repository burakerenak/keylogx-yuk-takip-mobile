import React, { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Layout from '../layouts/Layout';
import Text from '../components/Text';
import Box from '../components/Box';
import { theme } from '../theme/theme';
import { formatWeight, sum } from '../utils/numberUtils';
import { getDistanceKm } from '../utils/commonUtils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { GetAmbarVoyageListResponseData } from '../types/ambarVoyage.types';
import { getAmbarVoyageList } from '../api/ambarVoyage';
import ScrollView from '../components/ScrollView';
import BottomMenu from '../components/BottomMenu';

export default function HomeScreen() {
    const user = useAuthStore((s) => s.user);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    const [data, setData] = useState<GetAmbarVoyageListResponseData[]>([]);

    const [activeIndex, setActiveIndex] = useState(0);

    useFocusEffect(
        useCallback(() => {
            setActiveIndex((activeIndex) => {
                onGetAmbarVoyageList(activeIndex);

                return activeIndex;
            });

            return () => {
                // İstersen temizleme işlemleri
            };
        }, [])
    );

    const onGetAmbarVoyageList = async (_activeIndex: number = 0) => {
        var getAmbarVoyageListResponse = await getAmbarVoyageList({ driverId: user?.driverId });

        if (_activeIndex == 1)
            getAmbarVoyageListResponse = getAmbarVoyageListResponse.filter(x => x.endDate);
        else if (_activeIndex == 0)
            getAmbarVoyageListResponse = getAmbarVoyageListResponse.filter(x => !x.endDate);

        setData(getAmbarVoyageListResponse.map(function (x) {
            x.ambars = x.ambars.filter(x => x.deliverFirmCustomerAddressLat && x.deliverFirmCustomerAddressLon && x.loadingFirmCustomerAddressLat && x.loadingFirmCustomerAddressLon)

            return x;
        }));

        setActiveIndex(_activeIndex);
    };

    const onGetDistanceKm = (_item: GetAmbarVoyageListResponseData) => {
        var sum = 0;

        for (var i = 0; i < _item.ambars.length; i++) {
            var item = _item.ambars[i];
            sum += getDistanceKm(item.deliverFirmCustomerAddressLat ?? 0, item.deliverFirmCustomerAddressLon ?? 0, item.loadingFirmCustomerAddressLat ?? 0, item.loadingFirmCustomerAddressLon ?? 0);
        }

        return sum;
    }

    return (
        <Layout title='Seferlerim' hasPadding={false}>
            <ScrollView>
                {/* <TouchableOpacity onPress={logout}><Text>LOGOUT</Text></TouchableOpacity> */}

                {
                    data.map((item, index) => (
                        <Box
                            onPress={() => navigation.navigate('Order', { ambarVoyageId: item.ambarVoyageId })}
                            mt={index == 0 ? 0 : 15}
                            borderRadius={16}
                            boxShadow='0 2px 6px rgba(16,24,40,.04)'
                            borderColor={theme.colors.border}
                            borderWidth={1}
                            p={15}
                            bg={theme.colors.white}
                        >
                            <Box flexDirection='row'>
                                <Box flexGrow={1} justifyContent='center'>
                                    <Text fontWeight={'600'} color={theme.colors.muted} fontSize={theme.fontSizes.md}>{item.refNo}</Text>
                                </Box>
                                <Box justifyContent='center'>
                                    <Text fontWeight={'600'} color={theme.colors.blue} fontSize={theme.fontSizes.md}>{item.endDate ? 'Bitirildi' : item.startDate ? 'Başlatıldı' : 'Başlatılmadı'}</Text>
                                </Box>
                            </Box>

                            <Box mt={15} mb={15} height={1} bg={theme.colors.border} />

                            <Box flexDirection='row'>
                                <Box flex={1} justifyContent='center'>
                                    <Box flexDirection='row'>
                                        <Box justifyContent='center'>
                                            <Text fontSize={theme.fontSizes.xs} fontWeight='600' color={theme.colors.ink}>{formatWeight(sum(item.ambars.flatMap(x => x.ambarProducts).map(x => x.weight ?? 0)))}</Text>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box flex={1} justifyContent='center'>
                                    <Text fontSize={theme.fontSizes.xs} fontWeight='600' color={theme.colors.ink}>{onGetDistanceKm(item).toFixed(2)} km</Text>
                                </Box>
                                <Box flex={1} justifyContent='center'>
                                    <Text textAlign='right' fontSize={theme.fontSizes.xs} color={theme.colors.muted}>{item.endDateStr ? item.endDateStr : item.startDateStr ? item.startDateStr : item.createdDate}</Text>
                                </Box>
                            </Box>
                        </Box>
                    ))
                }

                {
                    data.length == 0 && (
                        <Box>
                            <Text color={theme.colors.muted} fontSize={theme.fontSizes.lg} textAlign='center'>Kayıt bulunamadı.</Text>
                        </Box>
                    )
                }
            </ScrollView>
            <BottomMenu
                activeIndex={activeIndex}
                onItem1Press={() => onGetAmbarVoyageList(0)}
                onItem2Press={() => onGetAmbarVoyageList(1)}
            />
        </Layout>
    );
}