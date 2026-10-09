import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { login, updateFirebaseToken } from '../api/user';
import AuthLayout from '../layouts/AuthLayout';
import { theme } from '../theme/theme';
import { deleteUser, saveUser } from '../services/userService';
import notificationService from '../services/notificationService';
import { Dugme } from '../ui';
import { SURUM_METNI } from '../surum';

const c = theme.colors;

/**
 * Giris (4.3, 09.10.2026): Keylogx logosu (dokununca ebbedev.com), Beni hatirla, altta surum bilgisi.
 * Beni hatirla isaretliyse oturum telefonun guvenli deposuna yazilir ve uygulama yeniden acilinca giris sorulmaz;
 * isaretsizse oturum yalniz uygulama acikken surer.
 */
export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [beniHatirla, setBeniHatirla] = useState(true);
    const [bekliyor, setBekliyor] = useState(false);

    const signIn = useAuthStore((s) => s.signIn);

    const onLogin = async () => {
        if (!username.trim() || !password) {
            return;
        }

        try {
            setBekliyor(true);

            var loginResponse = await login({ username: username.trim(), password, application: 'MOBILE' });

            if (beniHatirla)
                await saveUser(loginResponse);
            else
                await deleteUser();

            signIn(loginResponse);

            try {
                const token = await notificationService.getToken();

                if (token)
                    await updateFirebaseToken({ token: token });
            } catch {
                // Bildirim anahtari kaydedilemezse giris yine de surer.
            }
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        } finally {
            setBekliyor(false);
        }
    };

    return (
        <AuthLayout>
            <View style={s.ust}>
                <TouchableOpacity
                    accessibilityLabel="Keylogx — ebbedev.com"
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL('https://www.ebbedev.com').catch(() => undefined)}
                    style={s.logoKutu}
                >
                    <Image source={require('../assets/keylogx-logo.png')} style={s.logo} resizeMode="contain" />
                </TouchableOpacity>

                <Text style={s.baslik}>Sürücü Girişi</Text>
                <Text style={s.alt}>Kullanıcı adı ve şifrenizle giriş yapın.</Text>
            </View>

            <View style={s.form}>
                <Text style={s.etiket}>Kullanıcı adı</Text>
                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Kullanıcı adınız"
                    placeholderTextColor="#6F7C92"
                    style={s.kutu}
                />

                <Text style={[s.etiket, { marginTop: 14 }]}>Şifre</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="Şifreniz"
                    placeholderTextColor="#6F7C92"
                    style={s.kutu}
                    onSubmitEditing={onLogin}
                />

                <TouchableOpacity style={s.hatirla} onPress={() => setBeniHatirla(!beniHatirla)} activeOpacity={0.8} accessibilityRole="checkbox" accessibilityState={{ checked: beniHatirla }}>
                    <View style={[s.isaret, beniHatirla ? s.isaretAcik : null]}>
                        {beniHatirla ? <Check size={15} color={c.white} strokeWidth={3.5} /> : null}
                    </View>
                    <Text style={s.hatirlaYazi}>Beni hatırla</Text>
                </TouchableOpacity>

                <Dugme metin="Giriş Yap" onPress={onLogin} yukleniyor={bekliyor} pasif={!username.trim() || !password} style={{ marginTop: 8 }} />
            </View>

            <View style={{ flex: 1 }} />

            <View style={s.alt2}>
                <Text style={s.altYazi}>Keylogx Yük Takip</Text>
                <Text style={s.altYazi}>{SURUM_METNI}</Text>
            </View>
        </AuthLayout>
    );
}

const s = StyleSheet.create({
    ust: { alignItems: 'center', marginTop: 40, gap: 6 },
    logoKutu: { width: 132, height: 132, borderRadius: 32, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    logo: { width: 112, height: 112 },
    baslik: { fontSize: 26, fontWeight: '700', color: c.white },
    alt: { fontSize: 15, color: c.navyMuted },
    form: { marginTop: 36 },
    etiket: { fontSize: 13, fontWeight: '600', color: '#C9D2E0', marginBottom: 6 },
    kutu: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: c.navyBorder, backgroundColor: c.navyInput, color: c.white, paddingHorizontal: 16, fontSize: 16 },
    hatirla: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
    isaret: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#5B6A82', alignItems: 'center', justifyContent: 'center' },
    isaretAcik: { backgroundColor: c.blue, borderColor: c.blue },
    hatirlaYazi: { fontSize: 15, color: '#E6EBF3' },
    alt2: { alignItems: 'center', gap: 2, paddingTop: 20 },
    altYazi: { fontSize: 13, color: '#8A96AA' },
});
