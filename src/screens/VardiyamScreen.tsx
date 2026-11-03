import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getVardiyam, izinIptal, takasIptal } from '../api/istek';
import { VardiyamResponse } from '../types/istek.types';
import { Ayrac, Dugme, EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { bakiyeOzeti, BEKLIYOR, gunKodu, istekDurumAdi, istekDurumTonu, sayi, TATIL_KODU } from '../utils/istek';

const c = theme.colors;

/**
 * Vardiyam ve izinlerim (IK Faz 3, 03.11.2026): bugunden 14 gunluk vardiya, yillik izin bakiyesi, izin ve gun degisimi
 * isteklerim. Istekleri personel kartindaki ozel onaylayici ya da gorevinde Izin Onay olan kisi onaylar; onaylayici yoksa
 * istek dugmeleri pasiftir. Bekleyen istek iptal edilebilir.
 */
export default function VardiyamScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const [veri, setVeri] = useState<VardiyamResponse | undefined>(undefined);
    const [yenileniyor, setYenileniyor] = useState(false);
    const [islemde, setIslemde] = useState<string | undefined>(undefined);

    const yukle = useCallback(async () => {
        try {
            setVeri(await getVardiyam());
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        }
    }, []);

    useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

    const yenile = async () => {
        setYenileniyor(true);
        await yukle();
        setYenileniyor(false);
    };

    const iptal = async (tur: 'izin' | 'takas', id: string) => {
        setIslemde(id);
        try {
            if (tur === 'izin') await izinIptal(id);
            else await takasIptal(id);
            await yukle();
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        } finally {
            setIslemde(undefined);
        }
    };

    const onaylayiciVar = (veri?.onaylayicilar ?? []).length > 0;
    const b = veri?.bakiye;

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Vardiyam ve İzinlerim" onGeri={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} />

            {
                !veri
                    ? <ActivityIndicator color={c.blue} size="large" style={{ marginTop: 32 }} />
                    : (
                        <ScrollView contentContainerStyle={s.govde} refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}>
                            <Kart style={{ gap: 10 }}>
                                <Yazi tur="altBaslik">Yıllık izin</Yazi>
                                {
                                    b
                                        ? (
                                            <>
                                                <View style={s.satir}>
                                                    <Yazi tur="baslik" style={{ fontSize: 32, color: b.kalan < 0 ? c.red : c.ink }}>{sayi(b.kalan)}</Yazi>
                                                    <Yazi tur="kucuk" style={{ flex: 1 }}>gün kalan</Yazi>
                                                </View>
                                                <Yazi tur="kucuk">{bakiyeOzeti(b)}</Yazi>
                                                {b.sonrakiHakTarihi ? <Yazi tur="kucuk">{b.sonrakiHakTarihi} tarihinde {b.yillikHak} gün daha eklenir (kıdem {b.kidemYil} yıl).</Yazi> : null}
                                                {b.uyari ? <Yazi tur="kucuk" style={{ color: c.red }}>{b.uyari}</Yazi> : null}
                                            </>
                                        )
                                        : <Yazi tur="kucuk">Bakiye bilgisi yok.</Yazi>
                                }
                            </Kart>

                            <View style={{ gap: 8 }}>
                                <Dugme metin="İzin İste" tur="turkuaz" pasif={!onaylayiciVar} onPress={() => navigation.navigate('IzinIste')} />
                                <Dugme metin="Gün Değişimi İste" tur="cizgili" pasif={!onaylayiciVar} onPress={() => navigation.navigate('GunDegisimiIste')} />
                                {
                                    onaylayiciVar
                                        ? <Yazi tur="kucuk" style={{ textAlign: 'center' }}>İstekleriniz {veri.onaylayicilar.join(', ')} onayına gider.</Yazi>
                                        : <Yazi tur="kucuk" style={{ textAlign: 'center', color: c.red }}>İzin onaylayıcınız tanımlı değil; insan kaynaklarına başvurun.</Yazi>
                                }
                            </View>

                            <Kart style={{ gap: 0, paddingVertical: 6 }}>
                                <Yazi tur="altBaslik" style={{ paddingVertical: 8 }}>Önümüzdeki 14 gün</Yazi>
                                {
                                    veri.gunler.map((g, i) => (
                                        <View key={g.tarih}>
                                            {i > 0 ? <Ayrac /> : null}
                                            <View style={s.gun}>
                                                <Yazi tur="govdeKalin" style={{ width: 92 }}>{g.gunAdi}</Yazi>
                                                <Etiket
                                                    metin={gunKodu(g)}
                                                    ton={g.izinKodu ? 'yesil' : g.kod === TATIL_KODU ? 'gri' : g.kod ? 'mavi' : 'gri'}
                                                />
                                                <View style={{ flex: 1 }}>
                                                    <Yazi tur="kucuk" satir={1}>
                                                        {g.izinKodu ? g.izinAdi : g.kod === TATIL_KODU ? 'Hafta tatili' : g.saat ? `${g.ad ?? ''} ${g.saat}` : 'Plan yok'}
                                                    </Yazi>
                                                    {g.degisiklik ? <Yazi tur="kucuk" style={{ color: c.blue }}>Günlük değişiklik</Yazi> : null}
                                                    {g.ozelGun ? <Yazi tur="kucuk" style={{ color: c.orange }}>{g.ozelGun}</Yazi> : null}
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                }
                            </Kart>

                            <Yazi tur="altBaslik">İzin isteklerim</Yazi>
                            {veri.izinler.length === 0 ? <Yazi tur="kucuk">İzin kaydınız yok.</Yazi> : null}
                            {
                                veri.izinler.map(x => (
                                    <Kart key={x.izinId} style={{ gap: 6 }}>
                                        <View style={s.satir}>
                                            <Yazi tur="govdeKalin" style={{ flex: 1 }}>{x.turAdi}</Yazi>
                                            <Etiket metin={x.durumAdi || istekDurumAdi(x.durum)} ton={istekDurumTonu(x.durum)} />
                                        </View>
                                        <Yazi tur="kucuk">{x.baslangicStr} – {x.bitisStr} · {x.gunSayisi} gün{x.dusenGun != null ? ` (izinden düşen ${x.dusenGun})` : ''}</Yazi>
                                        {x.aciklama ? <Yazi tur="kucuk">{x.aciklama}</Yazi> : null}
                                        {x.redNedeni ? <Yazi tur="kucuk" style={{ color: c.red }}>Red nedeni: {x.redNedeni}</Yazi> : null}
                                        {x.kararVeren ? <Yazi tur="kucuk">Karar: {x.kararVeren} · {x.kararZamani}</Yazi> : null}
                                        {x.durum === BEKLIYOR ? <Dugme metin="İsteği iptal et" tur="cizgili" kucuk yukleniyor={islemde === x.izinId} onPress={() => iptal('izin', x.izinId)} /> : null}
                                    </Kart>
                                ))
                            }

                            <Yazi tur="altBaslik">Gün değişimi isteklerim</Yazi>
                            {veri.takaslar.length === 0 ? <Yazi tur="kucuk">Gün değişimi isteğiniz yok.</Yazi> : null}
                            {
                                veri.takaslar.map(x => (
                                    <Kart key={x.takasId} style={{ gap: 6 }}>
                                        <View style={s.satir}>
                                            <Yazi tur="govdeKalin" style={{ flex: 1 }}>{x.tarihStr}</Yazi>
                                            <Etiket metin={x.durumAdi || istekDurumAdi(x.durum)} ton={istekDurumTonu(x.durum)} />
                                        </View>
                                        <Yazi tur="kucuk">
                                            {x.karsiPersonelAdi
                                                ? (x.personelAdi === veri.personelAdi ? `${x.karsiPersonelAdi} ile değişim` : `${x.personelAdi} sizinle değişim istedi`)
                                                : 'İstenen'}
                                            {': '}{x.mevcutKod ? `${x.mevcutKod} → ` : ''}{x.istenenKod === TATIL_KODU ? 'Hafta tatili' : `${x.istenenKod}${x.istenenSaat ? ` ${x.istenenSaat}` : ''}`}
                                        </Yazi>
                                        {x.aciklama ? <Yazi tur="kucuk">{x.aciklama}</Yazi> : null}
                                        {x.redNedeni ? <Yazi tur="kucuk" style={{ color: c.red }}>Red nedeni: {x.redNedeni}</Yazi> : null}
                                        {x.durum === BEKLIYOR && x.personelAdi === veri.personelAdi
                                            ? <Dugme metin="İsteği iptal et" tur="cizgili" kucuk yukleniyor={islemde === x.takasId} onPress={() => iptal('takas', x.takasId)} />
                                            : null}
                                    </Kart>
                                ))
                            }
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
    satir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    gun: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
});
