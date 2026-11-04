import { getMessaging } from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import {
    PermissionStatus,
    RESULTS,
    checkNotifications,
    requestNotifications,
} from 'react-native-permissions';

class NotificationService {
    async initialize() {
        return await this.requestPermission();
    }

    async requestPermission(): Promise<boolean> {
        return (await this.izinIste()) === RESULTS.GRANTED;
    }

    /**
     * Bildirim izni: istenebiliyorsa (denied) sistem penceresi acilir ve son durum doner.
     * #542 Izinler ekrani kalici reddi (blocked) ayirt etmek icin durumu kullanir.
     */
    async izinIste(): Promise<PermissionStatus> {
        try {
            if (Platform.OS === 'ios') {
                const { status } = await checkNotifications();

                if (status === RESULTS.DENIED) {
                    const { status: newStatus } = await requestNotifications([
                        'alert',
                        'badge',
                        'sound',
                    ]);

                    return newStatus;
                }

                return status;
            }

            // Android 13+ (API 33) bildirim icin calisma zamani izni ister; istenmezse bildirimler hic gorunmez (#505).
            // Daha eski Android'de kutuphane dogrudan izinli doner.
            const { status } = await checkNotifications();

            if (status === RESULTS.DENIED) {
                const { status: newStatus } = await requestNotifications(['alert', 'sound']);
                return newStatus;
            }

            return status;
        } catch {
            return RESULTS.UNAVAILABLE;
        }
    }

    async getToken(): Promise<string | null> {
        try {
            const messaging = getMessaging();
            return await messaging.getToken();
        } catch {
            return null;
        }
    }
}

export default new NotificationService();