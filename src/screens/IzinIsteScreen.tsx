import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getVardiyam, izinIste } from '../api/istek';
import { VardiyamResponse } from '../types/istek.types';
import { Dugme, EkranBaslik, Kart, SecimKutusu, Yazi } from '../ui';
import { gunSayisi, izinTarihSecenekleri } from '../utils/istek';
import { isoTarih } from '../utils/mesaiPlanlama';

const c = theme.colors;

/** Gecmis gun icin izin istenemez (Burak, 03.11.2026): rapor gibi gecmis kayitlari insan kaynaklari web'den girer. */
const GERI_GUN = 0;
const ILERI_GUN = 180;

/**
 * Izin Iste (IK Faz 3, 03.11.2026): tur, baslangic, bitis (iki gun dahil), aciklama. Istek onaylayiciya bildirim olarak gider;
 * onaylanana kadar etkisizdir (hatirlatma, talep ve puantaj etkilenmez). Yillik izinde hafta tatili ve resmi tatil dusmez (sunucu hesaplar).
 */
export default function IzinIsteScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const [veri, setVeri] = useState<VardiyamResponse | undefined>(undefined);
    const bugun = isoTarih(new Date());
    const [tur, setTur] = useState<string | undefined>(undefined);
    const [bas, setBas] = useState<string>(bugun);
    const [bit, setBit] = useState<string>(bugun);
    const [aciklama, setAciklama] = useState('');
    const [gonderiliyor, setGonderiliyor] = useState(false);

    useFocusEffect(useCallback(() => {
        getVardiyam().then(setVeri).catch(() => undefined);
    }, []));

    const basSecenekleri = useMemo(() => izinTarihSecenekleri(new Date(), GERI_GUN, ILERI_GUN), []);
    const bitSecenekleri = useMemo(() => basSecenekleri.filter(x => x.deger >= bas), [basSecenekleri, bas]);
    const gun = gunSayisi(bas, bit);
    const secilenTur = veri?.izinTurleri.find(x => x.izinTuruId === tur);

    const basSec = (d: string) => {
        setBas(d);
        if (bit < d) setBit(d);
    };

    const gonder = async () => {
        if (!tur) return;
        setGonderiliyor(true);
        try {
            await izinIste({ izinTuruId: tur, baslangic: bas, bitis: bit, aciklama: aciklama.trim() || undefined });
            Alert.alert('İzin isteği gönderildi', 'Onaylayıcı karar verince bildirim alacaksınız.');
            navigation.goBack();
        } catch {
            // Hata mesajini baglanti katmani gosterir; form oldugu gibi kalir.
        } finally {
            setGonderiliyor(false);
        }
    };

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="İzin İste" onGeri={() => navigation.goBack()} />

            {
                !veri
                    ? <ActivityIndicator color={c.blue} size="large" style={{ marginTop: 32 }} />
                    : (
                        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                            <ScrollView contentContainerStyle={s.govde} keyboardShouldPersistTaps="handled">
                                <Kart style={{ gap: 14 }}>
                                    <SecimKutusu
                                        etiket="İzin türü"
                                        secenekler={veri.izinTurleri.map(x => ({ deger: x.izinTuruId, ad: `${x.kod} · ${x.ad}` }))}
                                        deger={tur}
                                        onSec={setTur}
                                    />
                                    <SecimKutusu etiket="Başlangıç" secenekler={basSecenekleri} deger={bas} onSec={basSec} />
                                    <SecimKutusu etiket="Bitiş" secenekler={bitSecenekleri} deger={bit} onSec={setBit} />
                                    <Yazi tur="govdeKalin">{gun} gün{secilenTur?.yillikIzindenDuser ? ' (hafta tatili ve resmi tatil yıllık izinden düşmez)' : ''}</Yazi>
                                    {secilenTur?.yasalGun ? <Yazi tur="kucuk">Yasal süre {secilenTur.yasalGun} gün.</Yazi> : null}
                                    {veri.bakiye && secilenTur?.yillikIzindenDuser ? <Yazi tur="kucuk">Kalan yıllık izniniz {veri.bakiye.kalan} gün.</Yazi> : null}
                                    <View style={{ gap: 6 }}>
                                        <Yazi tur="kucukKalin">Açıklama</Yazi>
                                        <TextInput
                                            value={aciklama}
                                            onChangeText={setAciklama}
                                            multiline
                                            maxLength={500}
                                            style={s.not}
                                            placeholder="İsteğe bağlı"
                                            placeholderTextColor={c.muted}
                                            accessibilityLabel="Açıklama"
                                        />
                                    </View>
                                </Kart>
                                <Dugme metin="İsteği Gönder" tur="turkuaz" pasif={!tur || gun === 0} yukleniyor={gonderiliyor} onPress={gonder} />
                                <Yazi tur="kucuk" style={{ textAlign: 'center' }}>
                                    {veri.onaylayicilar.length ? `Onaylayıcı: ${veri.onaylayicilar.join(', ')}. Onaylanana kadar izin geçerli değildir.` : 'İzin onaylayıcınız tanımlı değil.'}
                                </Yazi>
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
    not: { minHeight: 80, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 15, color: c.ink, backgroundColor: c.white, textAlignVertical: 'top' },
});
