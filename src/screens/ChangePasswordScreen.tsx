import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { changeMyPassword } from '../api/user';
import { deleteUser } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { Dugme, EkranBaslik, Yazi } from '../ui';

const c = theme.colors;

/** Sunucudaki SifreKurali ile ayni en az uzunluk. */
const EN_AZ = 6;

/**
 * Sifre degistir (4.3, 09.10.2026): mevcut / yeni / yeni (tekrar). Basarida sunucu tum oturumlari dusurur;
 * uygulama da kayitli oturumu siler ve giris ekranina doner.
 */
export default function ChangePasswordScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const signOut = useAuthStore((s) => s.signOut);

    const [mevcut, setMevcut] = useState('');
    const [yeni, setYeni] = useState('');
    const [tekrar, setTekrar] = useState('');
    const [bekliyor, setBekliyor] = useState(false);

    const hata =
        yeni && yeni.length < EN_AZ ? `Yeni şifre en az ${EN_AZ} karakter olmalıdır.` :
        tekrar && yeni !== tekrar ? 'Yeni şifreler aynı değil.' :
        yeni && mevcut && yeni === mevcut ? 'Yeni şifre mevcut şifrenizle aynı olamaz.' : undefined;

    const hazir = !!mevcut && yeni.length >= EN_AZ && yeni === tekrar && yeni !== mevcut;

    const kaydet = async () => {
        try {
            setBekliyor(true);
            const mesaj = await changeMyPassword({ currentPassword: mevcut, newPassword: yeni });

            Alert.alert('Şifreniz değişti', mesaj, [{
                text: 'Giriş ekranına git', onPress: async () => {
                    await deleteUser();
                    signOut();
                }
            }], { cancelable: false });
        } catch {
            // Hata mesajini (ör. "Mevcut şifreniz yanlış.") baglanti katmani gosterir.
        } finally {
            setBekliyor(false);
        }
    };

    const Kutu = ({ etiket, deger, setDeger, id }: { etiket: string, deger: string, setDeger: (v: string) => void, id: string }) => (
        <View style={{ gap: 6 }}>
            <Text nativeID={id} style={s.etiket}>{etiket}</Text>
            <TextInput accessibilityLabelledBy={id} value={deger} onChangeText={setDeger} secureTextEntry autoCapitalize="none" style={s.kutu} placeholderTextColor={c.placeholder} />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: c.bg }}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Şifre Değiştir" onGeri={() => navigation.goBack()} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
                    {Kutu({ etiket: 'Mevcut şifre', deger: mevcut, setDeger: setMevcut, id: 'mevcutSifre' })}
                    {Kutu({ etiket: 'Yeni şifre', deger: yeni, setDeger: setYeni, id: 'yeniSifre' })}
                    {Kutu({ etiket: 'Yeni şifre (tekrar)', deger: tekrar, setDeger: setTekrar, id: 'yeniSifreTekrar' })}

                    {hata ? <Yazi tur="kucuk" style={{ color: c.red }}>{hata}</Yazi> : null}
                    <Yazi tur="kucuk">Şifre değişince oturumunuz kapanır ve yeni şifrenizle yeniden giriş yaparsınız.</Yazi>
                </ScrollView>

                <SafeAreaView edges={['bottom']} style={s.alt}>
                    <Dugme metin="Şifreyi Değiştir" onPress={kaydet} pasif={!hazir} yukleniyor={bekliyor} />
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    etiket: { fontSize: 14, fontWeight: '600', color: c.ink },
    kutu: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#D5DAE3', backgroundColor: c.white, paddingHorizontal: 16, fontSize: 16, color: c.ink },
    alt: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
});
