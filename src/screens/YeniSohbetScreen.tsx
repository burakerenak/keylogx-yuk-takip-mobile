import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import Layout from '../layouts/Layout';
import { AppStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { mesajApi } from '../api/mesaj';
import { MesajKisi } from '../types/mesaj.types';
import { basHarfler, kisiSuz } from '../utils/mesajlasma';

type Props = NativeStackScreenProps<AppStackParamList, 'YeniSohbet'>;

/**
 * Yeni Sohbet (4.14, #615): firmadaki "Mesajlar" yetkili kisiler; dokununca birebir sohbet acilir (varsa mevcut olan).
 * Grup kurmak web'de (Mesajlar > Grup Yonetimi); mobilde eklenildigi gruplar listede gorunur.
 */
const YeniSohbetScreen = ({ navigation }: Props) => {
    const [kisiler, setKisiler] = useState<MesajKisi[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState<string | undefined>();
    const [arama, setArama] = useState('');
    const [aciliyor, setAciliyor] = useState<string | undefined>();

    useEffect(() => {
        mesajApi.kisiler()
            .then(setKisiler)
            .catch((e: any) => setHata(e?.message || 'Kişiler alınamadı.'))
            .finally(() => setYukleniyor(false));
    }, []);

    const ac = async (k: MesajKisi) => {
        if (aciliyor) return;
        try {
            setAciliyor(k.userId);
            const konusma = await mesajApi.birebirBaslat(k.userId);
            navigation.replace('Sohbet', { konusmaId: konusma.id, ad: konusma.ad || k.ad });
        } catch {
            // Hata penceresi istek katmaninda gosterildi.
        } finally {
            setAciliyor(undefined);
        }
    };

    const gorunen = kisiSuz(kisiler, arama);

    return (
        <Layout title="Yeni Sohbet" canGoBack hasPadding={false}>
            <View style={s.ust}>
                <View style={s.ara}>
                    <Search size={18} color={theme.colors.placeholder} />
                    <TextInput value={arama} onChangeText={setArama} placeholder="Kişi ara" placeholderTextColor={theme.colors.placeholder}
                        style={s.araGiris} accessibilityLabel="Kişi ara" autoFocus />
                </View>
            </View>
            {yukleniyor ? <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.blue} /> : (
                <FlatList
                    data={gorunen}
                    keyExtractor={k => k.userId}
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => <View style={s.ayrac} />}
                    contentContainerStyle={gorunen.length === 0 ? { flexGrow: 1 } : undefined}
                    renderItem={({ item: k }) => (
                        <TouchableOpacity style={s.satir} onPress={() => ac(k)} disabled={!!aciliyor} accessibilityRole="button" accessibilityLabel={`${k.ad} ile sohbet başlat`}>
                            <View style={s.avatar}><Text style={s.avatarYazi}>{basHarfler(k.ad)}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.ad}>{k.ad}</Text>
                                <Text style={s.alt}>{k.surucu ? 'Sürücü' : 'Ofis'}</Text>
                            </View>
                            {aciliyor === k.userId && <ActivityIndicator color={theme.colors.blue} />}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={s.bos}>
                            <Text style={s.bosYazi}>{hata ?? (arama ? 'Eşleşen kişi yok.' : 'Mesajlaşabileceğiniz kişi yok. Yöneticiniz "Mesajlar" yetkisini tanımlamalı.')}</Text>
                        </View>
                    }
                />
            )}
        </Layout>
    );
};

const s = StyleSheet.create({
    ust: { backgroundColor: theme.colors.white, paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    ara: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, paddingHorizontal: 12, height: 42, marginTop: 10 },
    araGiris: { flex: 1, fontSize: theme.fontSizes.md, color: theme.colors.ink, paddingVertical: 0 },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: theme.colors.white },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
    avatarYazi: { color: theme.colors.blueDark, fontWeight: '700' },
    ad: { fontSize: theme.fontSizes.md, fontWeight: '600', color: theme.colors.ink },
    alt: { fontSize: theme.fontSizes.xs, color: theme.colors.muted, marginTop: 2 },
    ayrac: { height: 1, backgroundColor: theme.colors.divider, marginLeft: 69 },
    bos: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    bosYazi: { fontSize: theme.fontSizes.sm, color: theme.colors.muted, textAlign: 'center' },
});

export default YeniSohbetScreen;
