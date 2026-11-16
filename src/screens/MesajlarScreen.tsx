import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Pin, Plus, Search, Users } from 'lucide-react-native';
import Layout from '../layouts/Layout';
import BottomMenu from '../components/BottomMenu';
import { AppStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { mesajApi } from '../api/mesaj';
import { BIREBIR, KonusmaOzeti, MesajSatiri } from '../types/mesaj.types';
import { basHarfler, konusmaSuz, konusmayiGuncelle, listeZamani, rozet, SohbetFiltresi } from '../utils/mesajlasma';
import { mesajOlayinaAbone } from '../services/mesajBaglantisi';
import { useAuthStore } from '../store/authStore';
import { okunmamisYenile } from '../services/mesajYoneticisi';

type Props = NativeStackScreenProps<AppStackParamList, 'Mesajlar'>;

const FILTRELER: { k: SohbetFiltresi, ad: string }[] = [{ k: 'tumu', ad: 'Tümü' }, { k: 'okunmamis', ad: 'Okunmamış' }, { k: 'gruplar', ad: 'Gruplar' }];

/**
 * Mesajlar (4.14, 17.11.2026, #615): sohbet listesi. Tumu / Okunmamis / Gruplar, arama, Yeni Sohbet.
 * Yeni mesaj anlik olarak listeyi gunceller; ekrana her donuste liste yenilenir.
 */
const MesajlarScreen = ({ navigation }: Props) => {
    const benimId = useAuthStore((s) => s.user?.id);
    const [liste, setListe] = useState<KonusmaOzeti[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState<string | undefined>();
    const [filtre, setFiltre] = useState<SohbetFiltresi>('tumu');
    const [arama, setArama] = useState('');
    const [yaziyor, setYaziyor] = useState<Record<string, true>>({});

    const yukle = useCallback(async () => {
        try {
            setHata(undefined);
            setListe(await mesajApi.konusmalar());
            okunmamisYenile();
        } catch (e: any) {
            setHata(e?.message || 'Sohbetler alınamadı. İnternet bağlantınızı kontrol edip yenileyin.');
        } finally {
            setYukleniyor(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

    useEffect(() => {
        const kapat = [
            mesajOlayinaAbone('mesaj', (m: MesajSatiri) => setListe(l => {
                if (!l.some(x => x.id === m.konusmaId)) { yukle(); return l; }
                return konusmayiGuncelle(l, m, benimId, undefined);
            })),
            mesajOlayinaAbone('konusma', () => yukle()),
            mesajOlayinaAbone('grubaEklendi', () => yukle()),
            mesajOlayinaAbone('geriAlindi', () => yukle()),
            mesajOlayinaAbone('yenidenBaglandi', () => yukle()),
            mesajOlayinaAbone('okundu', (v: any) => { if (v?.userId === benimId) setListe(l => l.map(x => x.id === v.konusmaId ? { ...x, okunmamis: 0 } : x)); }),
            mesajOlayinaAbone('yaziyor', (v: any) => {
                if (!v?.konusmaId) return;
                setYaziyor(y => ({ ...y, [v.konusmaId]: true }));
                setTimeout(() => setYaziyor(y => { const { [v.konusmaId]: _, ...kalan } = y; return kalan; }), 4000);
            }),
        ];
        return () => kapat.forEach(k => k());
    }, [benimId, yukle]);

    const gorunen = konusmaSuz(liste, filtre, arama);

    const satir = ({ item: k }: { item: KonusmaOzeti }) => {
        const onEk = k.sonGonderen === 'Siz' ? 'Siz: ' : k.tur !== BIREBIR && k.sonGonderen ? k.sonGonderen + ': ' : '';
        return (
            <TouchableOpacity style={s.satir} onPress={() => navigation.navigate('Sohbet', { konusmaId: k.id, ad: k.ad })}
                accessibilityRole="button" accessibilityLabel={`${k.ad} sohbeti${k.okunmamis ? `, ${k.okunmamis} okunmamış` : ''}`}>
                <View style={[s.avatar, k.tur !== BIREBIR && s.avatarGrup]}>
                    {k.tur !== BIREBIR ? <Users size={20} color={theme.colors.teal} /> : <Text style={s.avatarYazi}>{basHarfler(k.ad)}</Text>}
                </View>
                <View style={s.orta}>
                    <View style={s.ustSatir}>
                        <Text style={s.ad} numberOfLines={1}>{k.ad}</Text>
                        <Text style={[s.zaman, k.okunmamis > 0 && s.zamanYeni]}>{listeZamani(k.sonMesajZamani)}</Text>
                    </View>
                    <View style={s.ustSatir}>
                        {yaziyor[k.id]
                            ? <Text style={s.yaziyor} numberOfLines={1}>yazıyor…</Text>
                            : <Text style={s.son} numberOfLines={1}>{k.sonMesaj ? onEk + k.sonMesaj : 'Henüz mesaj yok'}</Text>}
                        <View style={s.sag}>
                            {!!k.sabitlemeZamani && <Pin size={14} color={theme.colors.muted} />}
                            {k.okunmamis > 0 && <View style={s.rozet}><Text style={s.rozetYazi}>{rozet(k.okunmamis)}</Text></View>}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <Layout title="Mesajlar" hasPadding={false}>
                <View style={s.ust}>
                    <View style={s.ara}>
                        <Search size={18} color={theme.colors.placeholder} />
                        <TextInput value={arama} onChangeText={setArama} placeholder="Sohbet ara" placeholderTextColor={theme.colors.placeholder}
                            style={s.araGiris} accessibilityLabel="Sohbet ara" returnKeyType="search" />
                    </View>
                    <View style={s.filtreler}>
                        {FILTRELER.map(f => (
                            <TouchableOpacity key={f.k} onPress={() => setFiltre(f.k)} style={[s.filtre, filtre === f.k && s.filtreSecili]}
                                accessibilityRole="button" accessibilityState={{ selected: filtre === f.k }}>
                                <Text style={[s.filtreYazi, filtre === f.k && s.filtreYaziSecili]}>{f.ad}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {yukleniyor ? <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.blue} /> : (
                    <FlatList
                        data={gorunen}
                        keyExtractor={k => k.id}
                        renderItem={satir}
                        ItemSeparatorComponent={() => <View style={s.ayrac} />}
                        refreshControl={<RefreshControl refreshing={false} onRefresh={yukle} />}
                        contentContainerStyle={gorunen.length === 0 ? { flexGrow: 1 } : { paddingBottom: 90 }}
                        ListEmptyComponent={
                            <View style={s.bos}>
                                <Text style={s.bosBaslik}>{hata ? 'Sohbetler yüklenemedi' : filtre === 'tumu' && !arama ? 'Henüz sohbet yok' : 'Eşleşen sohbet yok'}</Text>
                                <Text style={s.bosYazi}>{hata ?? (filtre === 'tumu' && !arama ? 'Ofisteki biriyle yazışmak için sağ alttaki + düğmesine dokunun.' : 'Filtreyi ya da aramayı değiştirin.')}</Text>
                            </View>
                        }
                    />
                )}

                <TouchableOpacity style={s.yeni} onPress={() => navigation.navigate('YeniSohbet')} accessibilityRole="button" accessibilityLabel="Yeni sohbet">
                    <Plus size={26} color={theme.colors.white} />
                </TouchableOpacity>
            </Layout>
            <BottomMenu activeIndex={3} />
        </View>
    );
};

const s = StyleSheet.create({
    ust: { backgroundColor: theme.colors.white, paddingHorizontal: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 10 },
    ara: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, paddingHorizontal: 12, height: 42, marginTop: 10 },
    araGiris: { flex: 1, fontSize: theme.fontSizes.md, color: theme.colors.ink, paddingVertical: 0 },
    filtreler: { flexDirection: 'row', gap: 8 },
    filtre: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radius.pill, backgroundColor: theme.colors.bg },
    filtreSecili: { backgroundColor: theme.colors.blueSoft },
    filtreYazi: { fontSize: theme.fontSizes.sm, fontWeight: '600', color: theme.colors.inkSoft },
    filtreYaziSecili: { color: theme.colors.blueDark },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: theme.colors.white },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
    avatarGrup: { backgroundColor: theme.colors.tealSoft },
    avatarYazi: { color: theme.colors.blueDark, fontWeight: '700', fontSize: theme.fontSizes.md },
    orta: { flex: 1, minWidth: 0, gap: 3 },
    ustSatir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ad: { flex: 1, fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.ink },
    zaman: { fontSize: theme.fontSizes.xs, color: theme.colors.muted },
    zamanYeni: { color: theme.colors.blue, fontWeight: '700' },
    son: { flex: 1, fontSize: theme.fontSizes.sm, color: theme.colors.muted },
    yaziyor: { flex: 1, fontSize: theme.fontSizes.sm, color: theme.colors.green, fontStyle: 'italic' },
    sag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rozet: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    rozetYazi: { color: theme.colors.white, fontSize: theme.fontSizes.xs, fontWeight: '700' },
    ayrac: { height: 1, backgroundColor: theme.colors.divider, marginLeft: 73 },
    bos: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 6 },
    bosBaslik: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.ink },
    bosYazi: { fontSize: theme.fontSizes.sm, color: theme.colors.muted, textAlign: 'center' },
    yeni: { position: 'absolute', right: 18, bottom: 18, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.blue, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
});

export default MesajlarScreen;
