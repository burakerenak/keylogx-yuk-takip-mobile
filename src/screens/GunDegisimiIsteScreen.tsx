import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getVardiyam, takasIste } from '../api/istek';
import { VardiyamResponse } from '../types/istek.types';
import { Dugme, EkranBaslik, Kart, SecimKutusu, Yazi } from '../ui';
import { gunKodu, TATIL_KODU } from '../utils/istek';

const c = theme.colors;

type Yol = 'takas' | 'vardiya';

/**
 * Gun Degisimi Iste (IK Faz 3, 03.11.2026): onumuzdeki 14 gunden biri; ya bir arkadasla takas (onaylaninca o gun
 * arkadasinizin vardiyasini, o da sizinkini alir) ya da istenen vardiya / hafta tatili. Onaylayici karar verir.
 */
export default function GunDegisimiIsteScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const [veri, setVeri] = useState<VardiyamResponse | undefined>(undefined);
    const [tarih, setTarih] = useState<string | undefined>(undefined);
    const [yol, setYol] = useState<Yol>('takas');
    const [karsi, setKarsi] = useState<string | undefined>(undefined);
    const [istenen, setIstenen] = useState<string | undefined>(undefined);
    const [aciklama, setAciklama] = useState('');
    const [gonderiliyor, setGonderiliyor] = useState(false);

    useFocusEffect(useCallback(() => {
        getVardiyam().then(setVeri).catch(() => undefined);
    }, []));

    const gunler = (veri?.gunler ?? []).filter(g => g.kod);
    const secilenGun = gunler.find(g => g.tarih === tarih);
    const vardiyaSecenekleri = [
        ...(veri?.vardiyalar ?? []).filter(v => v.kod !== secilenGun?.kod).map(v => ({ deger: v.vardiyaTanimiId, ad: `${v.kod} · ${v.ad} ${v.baslangic}–${v.bitis}` })),
        ...(secilenGun?.kod !== TATIL_KODU ? [{ deger: TATIL_KODU, ad: 'HT · Hafta tatili' }] : []),
    ];
    const hazir = !!tarih && (yol === 'takas' ? !!karsi : !!istenen);

    const gonder = async () => {
        if (!tarih) return;
        setGonderiliyor(true);
        try {
            await takasIste({
                tarih,
                karsiPersonnelId: yol === 'takas' ? karsi : undefined,
                tatil: yol === 'vardiya' && istenen === TATIL_KODU,
                istenenVardiyaTanimiId: yol === 'vardiya' && istenen !== TATIL_KODU ? istenen : undefined,
                aciklama: aciklama.trim() || undefined,
            });
            Alert.alert('Gün değişimi isteği gönderildi', 'Onaylayıcı karar verince bildirim alacaksınız.');
            navigation.goBack();
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        } finally {
            setGonderiliyor(false);
        }
    };

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Gün Değişimi İste" onGeri={() => navigation.goBack()} />

            {
                !veri
                    ? <ActivityIndicator color={c.blue} size="large" style={{ marginTop: 32 }} />
                    : (
                        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                            <ScrollView contentContainerStyle={s.govde} keyboardShouldPersistTaps="handled">
                                {
                                    gunler.length === 0
                                        ? <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center' }}>Önümüzdeki 14 günde vardiya planınız yok; gün değişimi istenemez.</Yazi>
                                        : null
                                }
                                <Kart style={{ gap: 14 }}>
                                    <SecimKutusu
                                        etiket="Gün"
                                        secenekler={gunler.map(g => ({ deger: g.tarih, ad: `${g.gunAdi} · ${gunKodu(g)}${g.saat ? ` ${g.saat}` : ''}` }))}
                                        deger={tarih}
                                        onSec={d => { setTarih(d); setIstenen(undefined); }}
                                        bosMetin="Vardiya planı yok"
                                    />
                                    <View style={s.satir}>
                                        <Dugme metin="Arkadaşla takas" tur={yol === 'takas' ? 'mavi' : 'cizgili'} kucuk style={{ flex: 1 }} onPress={() => setYol('takas')} />
                                        <Dugme metin="Vardiya / tatil" tur={yol === 'vardiya' ? 'mavi' : 'cizgili'} kucuk style={{ flex: 1 }} onPress={() => setYol('vardiya')} />
                                    </View>
                                    {
                                        yol === 'takas'
                                            ? (
                                                <>
                                                    <SecimKutusu
                                                        etiket="Takas yapılacak kişi"
                                                        secenekler={veri.takasPersonelleri.map(x => ({ deger: x.personnelId, ad: x.ad ?? '' }))}
                                                        deger={karsi}
                                                        onSec={setKarsi}
                                                        bosMetin="Vardiyalı başka personel yok"
                                                    />
                                                    <Yazi tur="kucuk">Onaylanınca o gün arkadaşınızın vardiyasında, o da sizin vardiyanızda çalışır.</Yazi>
                                                </>
                                            )
                                            : <SecimKutusu etiket="İstenen" secenekler={vardiyaSecenekleri} deger={istenen} onSec={setIstenen} pasif={!tarih} />
                                    }
                                    <View style={{ gap: 6 }}>
                                        <Yazi tur="kucukKalin">Açıklama</Yazi>
                                        <TextInput
                                            value={aciklama}
                                            onChangeText={setAciklama}
                                            multiline
                                            maxLength={500}
                                            style={s.not}
                                            placeholder="İsteğe bağlı (ör. doktor randevusu)"
                                            placeholderTextColor={c.muted}
                                            accessibilityLabel="Açıklama"
                                        />
                                    </View>
                                </Kart>
                                <Dugme metin="İsteği Gönder" tur="turkuaz" pasif={!hazir} yukleniyor={gonderiliyor} onPress={gonder} />
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
    satir: { flexDirection: 'row', gap: 8 },
    not: { minHeight: 80, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 15, color: c.ink, backgroundColor: c.white, textAlignVertical: 'top' },
});
