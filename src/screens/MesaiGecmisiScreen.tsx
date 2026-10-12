import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getMesaiGecmisim } from '../api/mesai';
import { MesaiGecmisAy } from '../types/mesai.types';
import { EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { basHarfBuyuk, sureMetni } from '../utils/mesai';
import { kullaniciTuru } from '../utils/kullanici';

const c = theme.colors;

/**
 * 4.4 Profilim > Mesai Gecmisim (12.10.2026): kullanicinin kendi mesai kayitlarinin son 12 ayi (yeniden eskiye,
 * yalniz kaydi olan aylar). Her ay: gun sayisi, toplam sure; personelde normal / ek mesai; eksik cikis sayisi.
 * Aya dokununca o ayin gunleri (MesaiGecmisiGun) acilir. Fiyat gosterilmez.
 */
export default function MesaiGecmisiScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { personel } = kullaniciTuru();

    const [aylar, setAylar] = useState<MesaiGecmisAy[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [yenileniyor, setYenileniyor] = useState(false);
    const [yuklendi, setYuklendi] = useState(false);

    const yukle = useCallback(async () => {
        try {
            const sonuc = await getMesaiGecmisim();
            setAylar(sonuc?.aylar ?? []);
            setYuklendi(true);
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        }
    }, []);

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
            <EkranBaslik baslik="Mesai Geçmişim" altBaslik="Son 12 ay" onGeri={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={s.liste} refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}>
                {yukleniyor ? <ActivityIndicator color={c.teal} size="large" style={{ marginTop: 32 }} /> : null}

                {
                    aylar.map(x => {
                        const ayrinti = personel
                            ? [x.normalDk > 0 ? `Normal ${sureMetni(x.normalDk)}` : null, x.ekDk > 0 ? `Ek mesai ${sureMetni(x.ekDk)}` : null].filter(Boolean).join(' · ')
                            : '';

                        return (
                            <Kart
                                key={`${x.yil}-${x.ay}`}
                                onPress={() => navigation.navigate('MesaiGecmisiGun', { yil: x.yil, ay: x.ay, donemAdi: basHarfBuyuk(x.donemAdi) })}
                                style={s.kart}
                            >
                                <View style={{ flex: 1, gap: 6 }}>
                                    <Yazi tur="altBaslik">{basHarfBuyuk(x.donemAdi)}</Yazi>
                                    <Yazi tur="govdeKalin">{x.gunSayisi} gün · {sureMetni(x.sureDk)}</Yazi>
                                    {ayrinti ? <Yazi tur="kucuk">{ayrinti}</Yazi> : null}
                                    {x.eksikCikis > 0 ? <Etiket metin={`${x.eksikCikis} eksik çıkış`} ton="kirmizi" /> : null}
                                </View>
                                <ChevronRight size={22} color="#8A93A3" />
                            </Kart>
                        );
                    })
                }

                {
                    !yukleniyor && yuklendi && aylar.length === 0 && (
                        <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>Henüz mesai kaydınız yok.</Yazi>
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
    kart: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
