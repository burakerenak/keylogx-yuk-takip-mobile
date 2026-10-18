import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getMesaiGecmisim } from '../api/mesai';
import { MesaiGecmisGun, MesaiKaydiOzet } from '../types/mesai.types';
import { Ayrac, EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { gunBasligi, sureMetni } from '../utils/mesai';
import { paraMetni } from '../utils/mesaiPlanlama';

const c = theme.colors;

/** "07:56 – 19:30"; cikis yoksa acik kayitta "07:56 – açık", digerlerinde durum adi (Eksik çıkış). */
const saatAraligi = (k: MesaiKaydiOzet): string => {
    if (k.cikisSaati) return `${k.girisSaati} – ${k.cikisSaati}`;
    if (k.durum === 1) return `${k.girisSaati} – açık`;

    return `${k.girisSaati} – ${k.durumAdi}`;
};

/**
 * Tek mesai kaydi satiri: nokta (personelde is tipi), saat araligi, sure, ek mesai, durum etiketi.
 * 4.6: kisinin kendi kaydinda ucret (personelUcret) geliyorsa ek mesai satirinin sagida TL.
 */
const KayitSatiri = ({ k }: { k: MesaiKaydiOzet }) => {
    const baslik = k.tur === 1 && k.isTipiAdi ? `${k.noktaAdi} · ${k.isTipiAdi}` : k.noktaAdi;
    const sureVar = !!k.cikisSaati || k.sureDk > 0;
    const ucretVar = typeof k.personelUcret === 'number' && k.personelUcret > 0;

    return (
        <View style={s.kayit}>
            <View style={s.kayitUst}>
                <Yazi tur="govdeKalin" satir={1} style={{ flex: 1 }}>{baslik}</Yazi>
                {k.durum === 3 ? <Etiket metin={k.durumAdi || 'Eksik çıkış'} ton="kirmizi" /> : null}
                {k.durum === 1 ? <Etiket metin={k.durumAdi || 'Açık'} ton="turkuaz" /> : null}
            </View>
            <View style={s.kayitAlt}>
                <Yazi tur="govde" style={{ color: c.inkSoft, fontVariant: ['tabular-nums'] }}>{saatAraligi(k)}</Yazi>
                {sureVar ? <Yazi tur="kucukKalin">{sureMetni(k.sureDk)}</Yazi> : null}
            </View>
            {
                k.ekDk > 0 || ucretVar
                    ? (
                        <View style={s.kayitAlt}>
                            {k.ekDk > 0 ? <Yazi tur="kucuk" style={{ color: c.amberDark }}>Ek mesai {sureMetni(k.ekDk)}</Yazi> : <View />}
                            {ucretVar ? <Yazi tur="kucukKalin" style={{ color: c.ink }}>{paraMetni(k.personelUcret)}</Yazi> : null}
                        </View>
                    )
                    : null
            }
        </View>
    );
};

/**
 * 4.4 Mesai Gecmisim > ay detayi (12.10.2026): Mesai/Gecmisim (yil + ay) gunleri, yeniden eskiye.
 * Her gun bir kart: "12 Ekim, Pazartesi" + toplam sure; altinda o gunun kayitlari.
 */
export default function MesaiGecmisiGunScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const route = useRoute<RouteProp<AppStackParamList, 'MesaiGecmisiGun'>>();
    const { yil, ay, donemAdi } = route.params;

    const [gunler, setGunler] = useState<MesaiGecmisGun[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [yenileniyor, setYenileniyor] = useState(false);
    const [yuklendi, setYuklendi] = useState(false);

    const yukle = useCallback(async () => {
        try {
            const sonuc = await getMesaiGecmisim({ yil, ay });
            setGunler(sonuc?.gunler ?? []);
            setYuklendi(true);
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        }
    }, [yil, ay]);

    useEffect(() => {
        (async () => {
            await yukle();
            setYukleniyor(false);
        })();
    }, [yukle]);

    const yenile = async () => {
        setYenileniyor(true);
        await yukle();
        setYenileniyor(false);
    };

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik={donemAdi} altBaslik="Mesai Geçmişim" onGeri={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={s.liste} refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}>
                {yukleniyor ? <ActivityIndicator color={c.teal} size="large" style={{ marginTop: 32 }} /> : null}

                {
                    gunler.map(g => (
                        <Kart key={g.tarih} style={{ gap: 10 }}>
                            <View style={s.gunUst}>
                                <Yazi tur="govdeKalin" style={{ flex: 1, fontSize: 16, fontWeight: '700' }}>{gunBasligi(g.tarih, g.gunAdi)}</Yazi>
                                <Yazi tur="govdeKalin" style={{ color: c.tealDark }}>{sureMetni(g.sureDk)}</Yazi>
                            </View>
                            {
                                (g.kayitlar ?? []).map(k => (
                                    <View key={k.mesaiKaydiId} style={{ gap: 10 }}>
                                        <Ayrac />
                                        <KayitSatiri k={k} />
                                    </View>
                                ))
                            }
                        </Kart>
                    ))
                }

                {
                    !yukleniyor && yuklendi && gunler.length === 0 && (
                        <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>Bu ayda mesai kaydınız yok.</Yazi>
                    )
                }
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.bg }} />
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    liste: { padding: 16, gap: 12, paddingBottom: 24, flexGrow: 1 },
    gunUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    kayit: { gap: 4 },
    kayitUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    kayitAlt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
