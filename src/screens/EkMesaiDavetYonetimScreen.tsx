import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Minus, Plus, X } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { davetGuncelleMesaiTalebi, getMesaiTalebiListe, getMesaiTalebiSecenekler } from '../api/mesai';
import { MesaiTalebiItem, MesaiTalebiSecenekler } from '../types/mesai.types';
import { Dugme, EkranBaslik, Etiket, Kart, SecimKutusu, Yazi } from '../ui';
import { davetDurumMetni, davetDurumTonu, davetSayiHatasi } from '../utils/mesaiDavet';

const c = theme.colors;

const EN_FAZLA_KISI = 99;

/**
 * Davetleri yonet (30.10.2026, #515): kisi durumlari, cikar / yerine kisi sec, kisi sayisi. Ret ve yanit yok bildirimi buraya acar.
 * Reddeden kisi secilemez. Kaydet: yalniz yeni kisiye davet, cikarilana iptal gider; kalanlara bildirim yeniden gitmez.
 */
export default function EkMesaiDavetYonetimScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const route = useRoute<RouteProp<AppStackParamList, 'EkMesaiDavetYonetim'>>();
    const talepId = route.params.mesaiTalebiId;

    const [talep, setTalep] = useState<MesaiTalebiItem | null | undefined>(undefined);
    const [secenekler, setSecenekler] = useState<MesaiTalebiSecenekler | undefined>(undefined);
    const [kisi, setKisi] = useState(1);
    const [cikar, setCikar] = useState<string[]>([]);
    const [ekle, setEkle] = useState<string[]>([]);
    const [kaydediliyor, setKaydediliyor] = useState(false);

    const yukle = useCallback(async () => {
        try {
            const [liste, s] = await Promise.all([getMesaiTalebiListe({ durum: 'PLAN' }), getMesaiTalebiSecenekler()]);
            const t = liste.find(x => x.mesaiTalebiId === talepId) ?? null;

            setSecenekler(s);
            setTalep(t);
            setKisi(t?.kisiSayisi ?? 1);
            setCikar([]);
            setEkle([]);
        } catch {
            // Hata mesajini baglanti katmani gosterir.
            setTalep(null);
        }
    }, [talepId]);

    useEffect(() => { yukle(); }, [yukle]);

    const mevcut = (talep?.ayrilanlar ?? []).filter(x => !cikar.includes(x.personnelId));
    const reddedenler = talep?.reddedenler ?? [];
    const secilenSayi = mevcut.length + ekle.length;
    const hata = davetSayiHatasi(secilenSayi, kisi);
    const degisti = cikar.length > 0 || ekle.length > 0 || kisi !== talep?.kisiSayisi;

    const adayEkle = (id: string) => {
        if (cikar.includes(id))
            setCikar(o => o.filter(x => x !== id));
        else
            setEkle(o => (o.includes(id) ? o : [...o, id]));
    };

    const adaylar = (secenekler?.personeller ?? [])
        .filter(p => !mevcut.some(x => x.personnelId === p.personnelId) && !ekle.includes(p.personnelId) && !reddedenler.some(x => x.personnelId === p.personnelId))
        .map(p => ({ deger: p.personnelId, ad: p.ad }));

    const personelAdi = (id: string) => secenekler?.personeller?.find(x => x.personnelId === id)?.ad ?? 'Personel';

    const kaydet = async () => {
        if (hata || !degisti)
            return;

        setKaydediliyor(true);

        try {
            await davetGuncelleMesaiTalebi({ mesaiTalebiId: talepId, kisiSayisi: kisi, eklenecekPersonelIdleri: ekle, cikarilacakPersonelIdleri: cikar });

            if (navigation.canGoBack())
                navigation.goBack();
            else
                navigation.navigate('MesaiPlanlama');
        } catch {
            // Hata mesajini baglanti katmani gosterir; secim oldugu gibi kalir.
        } finally {
            setKaydediliyor(false);
        }
    };

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Davetleri Yönet" altBaslik="Mesai Planlama" onGeri={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} />

            {
                talep === undefined
                    ? <ActivityIndicator color={c.blue} size="large" style={{ marginTop: 32 }} />
                    : talep === null
                        ? <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center', marginTop: 24, padding: 16 }}>Bu talep bulunamadı: silinmiş ya da günü geçmiş olabilir.</Yazi>
                        : (
                            <ScrollView contentContainerStyle={s.govde} keyboardShouldPersistTaps="handled">
                                <Kart style={{ gap: 6 }}>
                                    <Yazi tur="govdeKalin">{talep.tarihStr} · {talep.depoAdi}</Yazi>
                                    <Etiket metin={talep.aralik} ton="mavi" />
                                    <Yazi tur="kucuk">{[talep.customerName, talep.divisionName, talep.poName, talep.poNo].filter(Boolean).join(' · ')}</Yazi>
                                </Kart>

                                <Kart style={{ gap: 12 }}>
                                    <View style={s.satir}>
                                        <Yazi tur="kucukKalin" style={{ flex: 1 }}>Kişi sayısı</Yazi>
                                        <TouchableOpacity style={[s.mini, kisi <= 1 ? s.pasif : null]} disabled={kisi <= 1} onPress={() => setKisi(kisi - 1)} accessibilityLabel="Kişi azalt">
                                            <Minus size={18} color={c.ink} />
                                        </TouchableOpacity>
                                        <Text style={s.sayi}>{kisi}</Text>
                                        <TouchableOpacity style={[s.mini, kisi >= EN_FAZLA_KISI ? s.pasif : null]} disabled={kisi >= EN_FAZLA_KISI} onPress={() => setKisi(kisi + 1)} accessibilityLabel="Kişi artır">
                                            <Plus size={18} color={c.ink} />
                                        </TouchableOpacity>
                                    </View>

                                    {
                                        mevcut.map(a => (
                                            <View key={a.personnelId} style={s.kisi}>
                                                <View style={{ flex: 1, gap: 2 }}>
                                                    <Yazi tur="govde">{a.ad}</Yazi>
                                                    {a.yanitSuresi ? <Yazi tur="kucuk">Yanıt süresi: {a.yanitSuresi}</Yazi> : null}
                                                    {a.telefonVar === false ? <Yazi tur="kucuk" style={{ color: c.red }}>Telefonu kayıtlı değil, bildirim gitmedi</Yazi> : null}
                                                </View>
                                                <Etiket metin={davetDurumMetni(a.davetDurumu)} ton={davetDurumTonu(a.davetDurumu)} />
                                                <TouchableOpacity onPress={() => setCikar(o => [...o, a.personnelId])} accessibilityRole="button" accessibilityLabel={`${a.ad} çıkar`} hitSlop={8}>
                                                    <X size={20} color={c.red} />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    }

                                    {
                                        ekle.map(id => (
                                            <View key={id} style={s.kisi}>
                                                <Yazi tur="govde" style={{ flex: 1 }}>{personelAdi(id)}</Yazi>
                                                <Etiket metin="Yeni" ton="gri" />
                                                <TouchableOpacity onPress={() => setEkle(o => o.filter(x => x !== id))} accessibilityRole="button" accessibilityLabel={`${personelAdi(id)} kaldır`} hitSlop={8}>
                                                    <X size={20} color={c.red} />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    }

                                    <SecimKutusu
                                        etiket={`Personel seç · ${secilenSayi}/${kisi}`}
                                        secenekler={adaylar}
                                        deger={undefined}
                                        onSec={adayEkle}
                                        yerTutucu="Kişi ekle"
                                        bosMetin="Eklenecek personel yok"
                                    />
                                </Kart>

                                {
                                    reddedenler.length
                                        ? (
                                            <Kart style={{ gap: 8 }}>
                                                <Yazi tur="kucukKalin">Reddedenler (yeniden seçilemez)</Yazi>
                                                {
                                                    reddedenler.map(a => (
                                                        <View key={a.personnelId} style={{ gap: 2 }}>
                                                            <Yazi tur="govde">{a.ad}{a.yanitSuresi ? ` · ${a.yanitSuresi}` : ''}</Yazi>
                                                            <Yazi tur="kucuk" style={{ color: c.red }}>{a.redNotu}</Yazi>
                                                        </View>
                                                    ))
                                                }
                                            </Kart>
                                        )
                                        : null
                                }

                                {hata ? <Yazi tur="kucuk" style={{ textAlign: 'center', color: c.red }}>{hata}</Yazi> : null}
                                <Dugme metin="Kaydet" onPress={kaydet} pasif={!!hata || !degisti} yukleniyor={kaydediliyor} />
                            </ScrollView>
                        )
            }

            <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.bg }} />
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    govde: { padding: 16, gap: 14, paddingBottom: 28 },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    kisi: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.divider },
    mini: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.white },
    pasif: { opacity: 0.4 },
    sayi: { minWidth: 26, textAlign: 'center', fontSize: 18, fontWeight: '700', color: c.ink, fontVariant: ['tabular-nums'] },
});
