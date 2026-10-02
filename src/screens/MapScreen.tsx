import React, { useCallback, useRef, useState } from "react";
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { AppStackParamList } from "../navigation/types";
import Layout from "../layouts/Layout";
import Box from "../components/Box";
import Button from "../components/Button";
import { theme } from "../theme/theme";
import MapView, { Marker, Polyline } from "react-native-maps";
import { getDistanceKm } from "../utils/commonUtils";
import { Alert, Linking } from "react-native";
import { getAmbarVoyageById } from "../api/ambarVoyage";
import { GetAmbarVoyageByIdResponse } from "../types/ambarVoyage.types";
import Text from "../components/Text";

interface Coordinate {
    latitude: number,
    longitude: number,
    color: string
}

const MapScreen = () => {
    const timeoutSec = 30;
    const mapRef = useRef<MapView>(null);
    const route = useRoute<RouteProp<AppStackParamList, 'Map'>>();
    const [data, setData] = useState<GetAmbarVoyageByIdResponse | undefined>(undefined);
    const [coordinates, setCoordinates] = useState<Coordinate[]>([]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            let timeout: ReturnType<typeof setTimeout>;

            const poll = async () => {
                if (cancelled) return;

                try {
                    await onGetAmbarVoyageById(route.params.ambarVoyageId);
                } finally {
                    if (!cancelled) {
                        timeout = setTimeout(poll, timeoutSec * 1000);
                    }
                }
            };

            poll();

            return () => {
                cancelled = true;
                clearTimeout(timeout);
            };
        }, [])
    );

    const onGetAmbarVoyageById = async (_ambarVoyageId: string) => {
        var getAmbarVoyageByIdResponse = await getAmbarVoyageById({ id: _ambarVoyageId });

        //TEST
        getAmbarVoyageByIdResponse = {
            ...getAmbarVoyageByIdResponse,
            deviceData: {
                latitude: 40.91976199835985,
                longitude: 29.295546868071366
            }
        };

        setData({
            ...getAmbarVoyageByIdResponse,
            ambars: getAmbarVoyageByIdResponse.ambars.filter(x => x.deliverFirmCustomerAddressLat && x.deliverFirmCustomerAddressLon && x.loadingFirmCustomerAddressLat && x.loadingFirmCustomerAddressLon)
        })

        setData(getAmbarVoyageByIdResponse);
        onMapReady(getAmbarVoyageByIdResponse);
    };

    const onMapReady = (_data: GetAmbarVoyageByIdResponse) => {
        if (mapRef && _data.deviceData) {
            var _coordinates: Coordinate[] = [
                {
                    latitude: _data.deviceData.latitude,
                    longitude: _data.deviceData.longitude,
                    color: theme.colors.blue
                }
            ]

            for (var i = 0; i < _data.ambars.length; i++) {
                var item = _data.ambars[i];

                _coordinates.push({
                    latitude: item.loadingFirmCustomerAddressLat,
                    longitude: item.loadingFirmCustomerAddressLon,
                    color: getColor(i)
                })

                _coordinates.push({
                    latitude: item.deliverFirmCustomerAddressLat,
                    longitude: item.deliverFirmCustomerAddressLon,
                    color: getColor(i)
                })
            }

            setCoordinates(_coordinates);

            mapRef.current?.fitToCoordinates(_coordinates, {
                edgePadding: {
                    top: 50,
                    right: 50,
                    bottom: 50,
                    left: 50,
                },
                animated: true,
            });
        }
    }

    const openNavigation = async () => {
        var _coordinates = coordinates.slice(1);

        try {
            if (_coordinates.length === 0) {
                return;
            }

            let url = 'https://www.google.com/maps/dir/?api=1&travelmode=driving';

            if (_coordinates.length === 1) {
                const destination = _coordinates[0];

                url += `&destination=${destination.latitude},${destination.longitude}`;
            } else {
                const origin = _coordinates[0];
                const destination = _coordinates[_coordinates.length - 1];

                url += `&origin=${origin.latitude},${origin.longitude}`;
                url += `&destination=${destination.latitude},${destination.longitude}`;

                const waypoints = _coordinates
                    .slice(1, -1)
                    .map(item => `${item.latitude},${item.longitude}`)
                    .join('|');

                if (waypoints) {
                    url += `&waypoints=${encodeURIComponent(waypoints)}`;
                }
            }

            await Linking.openURL(url);
        } catch {
            Alert.alert('Hata', 'Navigasyon açılamadı.');
        }
    }

    const onGetDistanceKm = () => {
        var sum = 0;

        for (var i = 1; i < coordinates.length; i++) {
            var prevItem = coordinates[i - 1];
            var currItem = coordinates[i];
            sum += getDistanceKm(prevItem.latitude, prevItem.longitude, currItem.latitude, currItem.longitude);
        }

        return sum;
    }

    const getColor = (_index: number) => {
        var colors = [theme.colors.green, theme.colors.red, theme.colors.black, theme.colors.orange]

        var color = colors[_index];

        return color;
    }

    return (
        <Layout
            titleTextAlign="right"
            title={onGetDistanceKm().toFixed(2) + ' km'}
            hasPadding={false}
            canGoBack
        >
            {
                (data && data.deviceData) && (
                    <React.Fragment>
                        <Box flexGrow={1}>
                            <MapView
                                customMapStyle={[]}
                                ref={mapRef}
                                style={{ flex: 1 }}
                                onMapReady={() => onMapReady(data)}
                            >
                                <Marker
                                    anchor={{ x: 0.5, y: 0.5 }}
                                    tracksViewChanges={false}
                                    coordinate={{
                                        latitude: data.deviceData.latitude,
                                        longitude: data.deviceData.longitude
                                    }}
                                >
                                    <Box borderRadius={99} p={2} bg={theme.colors.blue}>
                                        <Box borderRadius={99} bg={theme.colors.white}>
                                            <Box borderRadius={99} m={3} width={18} height={18} bg={theme.colors.blue}></Box>
                                        </Box>
                                    </Box>
                                </Marker>

                                {
                                    coordinates.map((item, index) => (
                                        <React.Fragment>
                                            {
                                                index > 0 && (
                                                    <Marker
                                                        anchor={{ x: 0.5, y: 0.5 }}
                                                        tracksViewChanges={false}
                                                        coordinate={{
                                                            latitude: item.latitude,
                                                            longitude: item.longitude
                                                        }}
                                                    >
                                                        <Box borderRadius={99} p={2} bg={item.color}>
                                                            <Box borderRadius={99} bg={theme.colors.white}>
                                                                <Box justifyContent="center" borderRadius={99} m={3} width={18} height={18} bg={item.color}>
                                                                    <Text fontWeight="600" fontSize={theme.fontSizes.xs} textAlign="center" color={theme.colors.white}>{(index)}</Text>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </Marker>
                                                )
                                            }
                                        </React.Fragment>
                                    ))
                                }

                                {
                                    coordinates.map((item, index) => (
                                        <React.Fragment>
                                            {
                                                index > 0 && (
                                                    <Polyline
                                                        coordinates={[
                                                            {
                                                                latitude: coordinates[index - 1].latitude,
                                                                longitude: coordinates[index - 1].longitude
                                                            },
                                                            {
                                                                latitude: item.latitude,
                                                                longitude: item.longitude
                                                            }
                                                        ]}
                                                        strokeColor={coordinates[index].color}
                                                        strokeWidth={4}
                                                    />
                                                )
                                            }
                                        </React.Fragment>
                                    ))
                                }
                            </MapView>
                        </Box>
                        <Box p={15} bg={theme.colors.bg} borderTopWidth={1} borderColor={theme.colors.border}>
                            <Button onPress={openNavigation} color={theme.colors.white} bg={theme.colors.green} text='Navigasyonu Aç' />
                        </Box>
                    </React.Fragment>
                )
            }
        </Layout>
    )
}

export default MapScreen;