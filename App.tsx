import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { Alert, Platform, StatusBar } from 'react-native';
import { getUser } from './src/services/userService';
import LoadingOverlay from './src/components/LoadingOverlay';
import notificationService from './src/services/notificationService';
import { updateFirebaseToken } from './src/api/user';
import Toast from 'react-native-toast-message';
import { yerelBildirimGoster } from './src/services/yerelBildirim';
import { bekleyeniAc, bildirimAc } from './src/services/bildirimYonlendirme';
import { bildirimHedefi } from './src/utils/mesaiDavet';
import { navigationRef } from './src/navigation/navigationRef';
import { getMessaging } from '@react-native-firebase/messaging';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from './src/theme/theme';

export default function App() {
    const signIn = useAuthStore((s) => s.signIn);
    const setHydrated = useAuthStore((s) => s.setHydrated);

    useEffect(() => {
        const init = async () => {
            await notificationService.initialize();

            const user = await getUser();

            if (user) {
                signIn(user);

                try {
                    const token = await notificationService.getToken();

                    if (token)
                        await updateFirebaseToken({ token: token });
                }
                catch {

                }
            }

            setHydrated(true);
        };

        init();
    }, []);

    useEffect(() => {
        const unsubscribe = getMessaging().onMessage(async remoteMessage => {
            if (remoteMessage && remoteMessage.notification && remoteMessage.notification.body && remoteMessage.notification.title) {
                // Uygulama acikken: Android bildirim alanina sesli bildirim (#505); iOS banner + sesi sistem gosterir (firebase.json).
                yerelBildirimGoster(remoteMessage.notification.title, remoteMessage.notification.body);
                // Ek mesai daveti / ret: yerel bildirim veri tasimaz, uygulama acikken dogrudan sorulur (#515).
                if (bildirimHedefi(remoteMessage.data)) {
                    Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body, [
                        { text: 'Sonra', style: 'cancel' },
                        { text: 'Aç', onPress: () => bildirimAc(remoteMessage.data) },
                    ]);
                    return;
                }
                if (Platform.OS === 'ios')
                    return;
                Toast.show({
                    type: 'info',
                    text1: remoteMessage.notification.title,
                    text2: remoteMessage.notification.body,
                });
            }
        });

        return unsubscribe;
    }, []);

    // Bildirime tiklama: arka plandayken ve uygulama kapaliyken (#515).
    useEffect(() => {
        const unsubscribe = getMessaging().onNotificationOpenedApp(remoteMessage => bildirimAc(remoteMessage?.data));

        getMessaging().getInitialNotification().then(remoteMessage => bildirimAc(remoteMessage?.data)).catch(() => undefined);

        return unsubscribe;
    }, []);

    return (
        <GestureHandlerRootView style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar
                    barStyle="light-content"
                    translucent={false}
                    backgroundColor={'transparent'}
                />

                <NavigationContainer ref={navigationRef} onReady={bekleyeniAc}>
                    <RootNavigator />
                </NavigationContainer>

                <LoadingOverlay />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}