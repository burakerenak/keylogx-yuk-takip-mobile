import React, { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getBekleyenIstekler, izinKarar, takasKarar } from '../api/istek';
import { BekleyenIsteklerResponse } from '../types/istek.types';
import { Dugme, EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { TATIL_KODU } from '../utils/istek';

const c = theme.colors;

type Secili = { tur: 'izin' | 'takas', id: string };

/**
 * Izin Onaylari (IK Faz 3, 03.11.2026): onaylayicinin karar verebilecegi bekleyen izin ve gun degisimi istekleri.
 * Onayla / Reddet; redde neden zorunlu. Karar istegin sahibine (takasta karsi personele de) bildirim olarak gider.
 */
export default function IzinOnaylariScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const [veri, setVeri] = useState<BekleyenIsteklerResponse | undefined>(undefined);
    const [yenileniyor, setYenileniyor] = useState(false);
    const [red, setRed] = useState<Secili | undefined>(undefined);
    const [neden, setNeden] = useState('');
    const [islemde, setIslemde] = useState<string | undefined>(undefined);

    const yukle = useCallback(async () => {
        try {
            setVeri(await getBekleyenIstekler());
        } catch {
            setVeri(onceki => onceki ?? { izinler: [], takaslar: [] });
        }
    }, []);

    useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

    const yenile = async () => {
        setYenileniyor(true);
        await yukle();
        setYenileniyor(false);
    };

    const karar = async (sec: Secili, onay: boolean) => {
        setIslemde(sec.id);
        try {
            const istek = { id: sec.id, onay, redNedeni: onay ? undefined : neden.trim() };
            if (sec.tur === 'izin') await izinKarar(istek);
            else await takasKarar(istek);
            setRed(undefined);
            setNeden('');
            await yukle();
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        } finally {
            setIslemde(undefined);
        }
    };

    const kararAlani = (sec: Secili) => red?.id === sec.id
        ? (
            <View style={{ gap: 8 }}>
                <Yazi tur="kucukKalin">Red nedeni</Yazi>
                <TextInput value={neden} onChangeText={setNeden} multiline maxLength={500} style={s.not} placeholder="Neden reddediyorsunuz?" placeholderTextColor={c.muted} accessibilityLabel="Red nedeni" />
                <Dugme metin="Reddet" tur="tehlike" pasif={!neden.trim()} yukleniyor={islemde === sec.id} onPress={() => karar(sec, false)} />
                <Dugme metin="Vazgeç" tur="cizgili" onPress={() => { setRed(undefined); setNeden(''); }} />
            </View>
        )
        : (
            <View style={s.satir}>
                <Dugme metin="Onayla" tur="turkuaz" kucuk style={{ flex: 1 }} yukleniyor={islemde === sec.id} onPress={() => karar(sec, true)} />
                <Dugme metin="Reddet" tur="cizgili" kucuk style={{ flex: 1 }} pasif={!!islemde} onPress={() => { setNeden(''); setRed(sec); }} />
            </View>
        );

    const bos = veri && veri.izinler.length === 0 && veri.takaslar.length === 0;

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="İzin Onayları" onGeri={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} />

            {
                !veri
                    ? <ActivityIndicator color={c.blue} size="large" style={{ marginTop: 32 }} />
                    : (
                        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                            <ScrollView contentContainerStyle={s.govde} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}>
                                {bos ? <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>Onay bekleyen istek yok.</Yazi> : null}

                                {veri.izinler.length ? <Yazi tur="altBaslik">İzin istekleri</Yazi> : null}
                                {
                                    veri.izinler.map(x => (
                                        <Kart key={x.izinId} style={{ gap: 8 }}>
                                            <View style={s.satir}>
                                                <Yazi tur="baslik" style={{ flex: 1, fontSize: 18 }}>{x.personelAdi}</Yazi>
                                                <Etiket metin={x.kod} ton="yesil" />
                                            </View>
                                            <Yazi tur="govdeKalin">{x.turAdi}</Yazi>
                                            <Yazi tur="kucuk">{x.baslangicStr} – {x.bitisStr} · {x.gunSayisi} gün{x.dusenGun != null ? ` (yıllık izinden düşen ${x.dusenGun})` : ''}</Yazi>
                                            {x.aciklama ? <Yazi tur="kucuk">{x.aciklama}</Yazi> : null}
                                            <Yazi tur="kucuk">İstek: {x.tarih}</Yazi>
                                            {kararAlani({ tur: 'izin', id: x.izinId })}
                                        </Kart>
                                    ))
                                }

                                {veri.takaslar.length ? <Yazi tur="altBaslik">Gün değişimi istekleri</Yazi> : null}
                                {
                                    veri.takaslar.map(x => (
                                        <Kart key={x.takasId} style={{ gap: 8 }}>
                                            <View style={s.satir}>
                                                <Yazi tur="baslik" style={{ flex: 1, fontSize: 18 }}>{x.personelAdi}</Yazi>
                                                <Etiket metin={x.tarihStr} ton="mavi" />
                                            </View>
                                            <Yazi tur="govdeKalin">
                                                {x.mevcutKod ?? '—'} → {x.istenenKod === TATIL_KODU ? 'Hafta tatili' : `${x.istenenKod}${x.istenenSaat ? ` ${x.istenenSaat}` : ''}`}
                                            </Yazi>
                                            {x.karsiPersonelAdi ? <Yazi tur="kucuk">Takas: {x.karsiPersonelAdi} ({x.karsiMevcutKod ?? '—'} → {x.mevcutKod ?? '—'})</Yazi> : null}
                                            {x.aciklama ? <Yazi tur="kucuk">{x.aciklama}</Yazi> : null}
                                            <Yazi tur="kucuk">İstek: {x.olusturmaZamani}</Yazi>
                                            {kararAlani({ tur: 'takas', id: x.takasId })}
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
    not: { minHeight: 80, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 15, color: c.ink, backgroundColor: c.white, textAlignVertical: 'top' },
});
