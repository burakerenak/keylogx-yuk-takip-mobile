import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronRight, LockKeyhole, LogOut } from 'lucide-react-native';
import BottomMenu from '../components/BottomMenu';
import { deleteUser } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getMyProfile } from '../api/user';
import { GetMyProfileResponse } from '../types/user.types';
import { BilgiSatiri, Dugme, Kart, Yazi } from '../ui';
import { SURUM_METNI } from '../surum';

const c = theme.colors;

const basHarfler = (ad?: string | null) => (ad ?? '').split(' ').filter(x => x).slice(0, 2).map(x => x[0]?.toLocaleUpperCase('tr-TR')).join('');

/**
 * Profilim (4.3, 09.10.2026): kullanici tanim ekranindaki bilgiler, Sifre Degistir ve Cikis Yap.
 */
const ProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const user = useAuthStore((s) => s.user);
    const signOut = useAuthStore((s) => s.signOut);
    const [profil, setProfil] = useState<GetMyProfileResponse | undefined>(undefined);

    useFocusEffect(useCallback(() => {
        (async () => {
            try {
                setProfil(await getMyProfile());
            } catch {
                // Hata mesajini baglanti katmani gosterir; ad soyad oturum bilgisinden gosterilir.
            }
        })();
    }, []));

    const cikis = () => {
        Alert.alert('Çıkış yapılsın mı?', '', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
                    await deleteUser();
                    signOut();
                }
            },
        ]);
    };

    const ad = profil?.nameSurname ?? user?.nameSurname ?? '';

    return (
        <View style={s.sayfa}>
            <StatusBar barStyle="light-content" backgroundColor={c.navy} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.navy }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={s.ust}>
                    <View style={s.avatar}><Text style={s.avatarYazi}>{basHarfler(ad)}</Text></View>
                    <Text style={s.ad}>{ad}</Text>
                    <Text style={s.alt}>{[profil?.driverName ? 'Sürücü' : null, profil?.companyName].filter(x => x).join(' · ')}</Text>
                </View>

                <View style={{ padding: 16, gap: 14 }}>
                    <Kart style={{ paddingVertical: 4 }}>
                        <BilgiSatiri etiket="Kullanıcı adı" deger={profil?.username} />
                        <BilgiSatiri etiket="E-posta" deger={profil?.email} />
                        <BilgiSatiri etiket="Telefon" deger={profil?.phone || profil?.driverPhone} />
                        <BilgiSatiri etiket="Şirket" deger={profil?.companyName} />
                        <BilgiSatiri etiket="Sürücü kaydı" deger={profil?.driverName} son />
                    </Kart>

                    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ChangePassword')} style={s.satirDugme}>
                        <LockKeyhole size={22} color={c.blue} />
                        <Yazi tur="govdeKalin" style={{ flex: 1, fontSize: 16 }}>Şifre Değiştir</Yazi>
                        <ChevronRight size={20} color="#8A93A3" />
                    </TouchableOpacity>

                    <Dugme metin="Çıkış Yap" tur="tehlike" onPress={cikis} ikon={<LogOut size={20} color={c.red} />} style={{ marginTop: 8 }} />
                    <Yazi tur="kucuk" style={{ textAlign: 'center' }}>{SURUM_METNI}</Yazi>
                </View>
            </ScrollView>

            <BottomMenu activeIndex={2} />
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    ust: { alignItems: 'center', gap: 8, paddingTop: 24, paddingBottom: 22, backgroundColor: c.navy },
    avatar: { width: 76, height: 76, borderRadius: 99, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center' },
    avatarYazi: { fontSize: 28, fontWeight: '700', color: c.white },
    ad: { fontSize: 20, fontWeight: '700', color: c.white },
    alt: { fontSize: 14, color: c.navyMuted },
    satirDugme: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c.white, borderWidth: 1, borderColor: c.border },
});

export default ProfileScreen;
