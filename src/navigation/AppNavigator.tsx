import React from 'react';
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

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
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
        </Stack.Navigator>
    );
};
