import { getMessaging } from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import {
    RESULTS,
    checkNotifications,
    requestNotifications,
} from 'react-native-permissions';

class NotificationService {
    async initialize() {
        return await this.requestPermission();
    }

    async requestPermission(): Promise<boolean> {
        try {
            if (Platform.OS === 'ios') {
                const { status } = await checkNotifications();

                if (status === RESULTS.DENIED) {
                    const { status: newStatus } = await requestNotifications([
                        'alert',
                        'badge',
                        'sound',
                    ]);

                    return newStatus === RESULTS.GRANTED;
                }

                return status === RESULTS.GRANTED;
            }

            // Android 13+ (API 33) bildirim icin calisma zamani izni ister; istenmezse bildirimler hic gorunmez (#505).
            // Daha eski Android'de kutuphane dogrudan izinli doner.
            const { status } = await checkNotifications();

            if (status === RESULTS.DENIED) {
                const { status: newStatus } = await requestNotifications(['alert', 'sound']);
                return newStatus === RESULTS.GRANTED;
            }

            return status === RESULTS.GRANTED;
        } catch (error) {
            return false;
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