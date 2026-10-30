import React, { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { davetYanit, getDavetlerim } from '../api/mesai';
import { MesaiDavetItem } from '../types/mesai.types';
import { Dugme, EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { DAVET_BEKLIYOR, DAVET_KALAMIYOR, DAVET_KALIYOR, davetDurumMetni, davetDurumTonu } from '../utils/mesaiDavet';

const c = theme.colors;

const NOT_UZUNLUGU = 500;

/**
 * Ek mesai daveti (30.10.2026, #515): tarih, saat, depo; "Ek Mesaiye Kalıyorum" / "Ek Mesaiye Kalamıyorum".
 * Kalamiyorum'da not zorunlu ve yanit kesin. Kaliyorum talep saati baslayana kadar degistirilebilir (sunucu Degistirilebilir ile bildirir).
 * Bildirime tiklaninca talep kimligiyle acilir; davet iptal edildiyse uyari gosterir.
 */
export default function EkMesaiDavetScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const route = useRoute<RouteProp<AppStackParamList, 'EkMesaiDavet'>>();
    const talepId = route.params?.mesaiTalebiId;

    const [davetler, setDavetler] = useState<MesaiDavetItem[] | undefined>(undefined);
    const [yenileniyor, setYenileniyor] = useState(false);
    const [notAcik, setNotAcik] = useState<string | undefined>(undefined);
    const [not, setNot] = useState('');
    const [islemde, setIslemde] = useState<string | undefined>(undefined);

    const yukle = useCallback(async () => {
        try {
            setDavetler(await getDavetlerim());
        } catch {
            // Hata mesajini baglanti katmani gosterir.
            setDavetler(onceki => onceki ?? []);
        }
    }, []);

    useFocusEffect(useCallback(() => { yukle(); }, [yukle, talepId]));

    const yenile = async () => {
        setYenileniyor(true);
        await yukle();
        setYenileniyor(false);
    };

    const yanitla = async (d: MesaiDavetItem, kaliyor: boolean) => {
        setIslemde(d.mesaiTalebiId);

        try {
            setDavetler(await davetYanit({ mesaiTalebiId: d.mesaiTalebiId, kaliyor, not: kaliyor ? undefined : not.trim() }));
            setNotAcik(undefined);
            setNot('');
        } catch {
            // Hata mesajini baglanti katmani gosterir; form oldugu gibi kalir.
        } finally {
            setIslemde(undefined);
        }
    };

    const sirali = [...(davetler ?? [])].sort((a, b) => (a.mesaiTalebiId === talepId ? -1 : b.mesaiTalebiId === talepId ? 1 : 0));
    const gecersiz = !!talepId && !!davetler && !davetler.some(x => x.mesaiTalebiId === talepId);

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Ek Mesai Daveti" onGeri={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} />

            {
                !davetler
                    ? <ActivityIndicator color={c.blue} size="large" style={{ marginTop: 32 }} />
                    : (
                        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                            <ScrollView contentContainerStyle={s.govde} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}>
                                {
                                    gecersiz
                                        ? <Yazi tur="govde" style={{ color: c.red, textAlign: 'center' }}>Bu davet artık geçerli değil: iptal edilmiş ya da süresi dolmuş.</Yazi>
                                        : null
                                }
                                {
                                    sirali.length === 0
                                        ? <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>Ek mesai davetiniz yok.</Yazi>
                                        : null
                                }
                                {
                                    sirali.map(d => (
                                        <Kart key={d.mesaiTalebiId} style={{ gap: 12 }}>
                                            <View style={s.satir}>
                                                <Yazi tur="baslik" style={{ flex: 1 }}>{d.tarihStr}</Yazi>
                                                <Etiket metin={davetDurumMetni(d.davetDurumu)} ton={davetDurumTonu(d.davetDurumu)} />
                                            </View>
                                            <View style={{ gap: 4 }}>
                                                <Etiket metin={d.aralik} ton="mavi" />
                                                <Yazi tur="govdeKalin">{d.depoAdi}</Yazi>
                                                {d.aciklama ? <Yazi tur="kucuk">{d.aciklama}</Yazi> : null}
                                            </View>

                                            {d.davetDurumu === DAVET_KALIYOR ? <Yazi tur="kucuk" style={{ color: c.green }}>Ek mesaiye kalıyorsunuz.{d.yanitZamani ? ` Yanıt: ${d.yanitZamani}` : ''}</Yazi> : null}
                                            {d.davetDurumu === DAVET_KALAMIYOR ? <Yazi tur="kucuk" style={{ color: c.red }}>Kalamıyorum dediniz: {d.redNotu}</Yazi> : null}

                                            {
                                                notAcik === d.mesaiTalebiId
                                                    ? (
                                                        <View style={{ gap: 8 }}>
                                                            <Yazi tur="kucukKalin">Kalamama nedeni</Yazi>
                                                            <TextInput
                                                                value={not}
                                                                onChangeText={setNot}
                                                                multiline
                                                                maxLength={NOT_UZUNLUGU}
                                                                style={s.not}
                                                                placeholder="Neden kalamıyorsunuz?"
                                                                placeholderTextColor={c.muted}
                                                                accessibilityLabel="Kalamama nedeni"
                                                            />
                                                            <Yazi tur="kucuk">Bu yanıt değiştirilemez; talebi girene bildirim gider.</Yazi>
                                                            <Dugme metin="Gönder" tur="tehlike" pasif={!not.trim()} yukleniyor={islemde === d.mesaiTalebiId} onPress={() => yanitla(d, false)} />
                                                            <Dugme metin="Vazgeç" tur="cizgili" onPress={() => { setNotAcik(undefined); setNot(''); }} />
                                                        </View>
                                                    )
                                                    : (
                                                        <View style={{ gap: 8 }}>
                                                            {
                                                                d.davetDurumu === DAVET_BEKLIYOR
                                                                    ? <Dugme metin="Ek Mesaiye Kalıyorum" tur="turkuaz" yukleniyor={islemde === d.mesaiTalebiId} onPress={() => yanitla(d, true)} />
                                                                    : null
                                                            }
                                                            {
                                                                d.davetDurumu === DAVET_BEKLIYOR || (d.davetDurumu === DAVET_KALIYOR && d.degistirilebilir)
                                                                    ? <Dugme metin="Ek Mesaiye Kalamıyorum" tur="cizgili" pasif={!!islemde} onPress={() => { setNot(''); setNotAcik(d.mesaiTalebiId); }} />
                                                                    : null
                                                            }
                                                        </View>
                                                    )
                                            }
                                        </Kart>
                                    ))
                                }
                            </ScrollView>
                        </KeyboardAvoidingView>
                    )
            }

            <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.bg }} />
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    govde: { padding: 16, gap: 14, paddingBottom: 28 },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    not: { minHeight: 90, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 15, color: c.ink, backgroundColor: c.white, textAlignVertical: 'top' },
});
