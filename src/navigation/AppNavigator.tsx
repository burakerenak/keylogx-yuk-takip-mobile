import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import DetailScreen from '../screens/DetailScreen';
import { AppStackParamList } from './types';
import MapScreen from '../screens/MapScreen';
import OrderScreen from '../screens/OrderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import UpdateProductScreen from '../screens/UpdateProductScreen';
import MesaiQrScreen from '../screens/MesaiQrScreen';
import MesaiGecmisiScreen from '../screens/MesaiGecmisiScreen';
import MesaiGecmisiGunScreen from '../screens/MesaiGecmisiGunScreen';
import MesaiPlanlamaScreen from '../screens/MesaiPlanlamaScreen';
import MesaiTalebiYeniScreen from '../screens/MesaiTalebiYeniScreen';
import EkMesaiDavetScreen from '../screens/EkMesaiDavetScreen';
import EkMesaiDavetYonetimScreen from '../screens/EkMesaiDavetYonetimScreen';
import VardiyamScreen from '../screens/VardiyamScreen';
import IzinIsteScreen from '../screens/IzinIsteScreen';
import GunDegisimiIsteScreen from '../screens/GunDegisimiIsteScreen';
import IzinOnaylariScreen from '../screens/IzinOnaylariScreen';
import IzinlerScreen from '../screens/IzinlerScreen';
import { eksikIzinVarsaAc } from '../services/izinDenetimi';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
    // #542: bu yigin oturum acilinca kurulur (giris ya da kayitli kullaniciyla acilis): eksik izin varsa Izinler ekrani.
    useEffect(() => { eksikIzinVarsaAc(); }, []);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Tasks" component={TasksScreen} />
            <Stack.Screen name="Detail" component={DetailScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="Order" component={OrderScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="UpdateProduct" component={UpdateProductScreen} />
            <Stack.Screen name="MesaiQr" component={MesaiQrScreen} />
            <Stack.Screen name="MesaiGecmisi" component={MesaiGecmisiScreen} />
            <Stack.Screen name="MesaiGecmisiGun" component={MesaiGecmisiGunScreen} />
            <Stack.Screen name="MesaiPlanlama" component={MesaiPlanlamaScreen} />
            <Stack.Screen name="MesaiTalebiYeni" component={MesaiTalebiYeniScreen} />
            <Stack.Screen name="EkMesaiDavet" component={EkMesaiDavetScreen} />
            <Stack.Screen name="EkMesaiDavetYonetim" component={EkMesaiDavetYonetimScreen} />
            <Stack.Screen name="Vardiyam" component={VardiyamScreen} />
            <Stack.Screen name="IzinIste" component={IzinIsteScreen} />
            <Stack.Screen name="GunDegisimiIste" component={GunDegisimiIsteScreen} />
            <Stack.Screen name="IzinOnaylari" component={IzinOnaylariScreen} />
            <Stack.Screen name="Izinler" component={IzinlerScreen} />
        </Stack.Navigator>
    );
};
