import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { getMesaiTalebiListe, kisiDegistirMesaiTalebi, silMesaiTalebi } from '../api/mesai';
import { MesaiTalebiItem } from '../types/mesai.types';
import { Dugme, EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { davetDurumMetni, davetDurumTonu } from '../utils/mesaiDavet';
import { dolulukKutulari, eksikSayisi, gunEkle, paraMetni, trTarih, yerlesenSayisi } from '../utils/mesaiPlanlama';

const c = theme.colors;

type Sekme = 'plan' | 'tamam';

/** Tamamlananlar sekmesinde gosterilen gecmis (gun). */
const TAMAM_GUN = 90;

const sirala = (liste: MesaiTalebiItem[], artan: boolean) =>
    [...liste].sort((a, b) => {
        const k = a.tarih < b.tarih ? -1 : a.tarih > b.tarih ? 1 : (a.baslangic ?? '').localeCompare(b.baslangic ?? '');

        return artan ? k : -k;
    });

/** "18.10.2026" -> "18.10" (kart basliginda yil yazilmaz). */
const kisaTarih = (t: MesaiTalebiItem) => (t.tarihStr || trTarih(t.tarih)).slice(0, 5);

/** Bos parcalari atlayarak " · " ile birlestirir. */
const birlestir = (...parcalar: (string | null | undefined)[]) => parcalar.filter(x => x && `${x}`.trim()).join(' · ');

/**
 * 4.6 Mesai Planlama (18.10.2026; sozlesme 4.3, R11a): Ek Mesai Talepleri, Gorevlerim'in sekme kalibiyla.
 *
 * - Planlananlar (MesaiTalebi/Liste durum=PLAN, bugun ve sonrasi): kisi -/+ (KisiDegistir, en az 1), Sil (onay), "+ Yeni Talep".
 * - Tamamlananlar (durum=TAMAM, gunu gecmis, son 90 gun): salt okunur; yerlesen kisi, siparis no + tutar.
 * - Faturali talep degistirilemez / silinemez: -/+ ve Sil gizlenir.
 * - Davetli talepte (#515) kisi durumlari gorunur; "Davetleri Yönet" ve kisi artirma yerine kisi secme ekranina gider.
 * - Her odaklanmada iki liste de yenilenir (Yeni Talep'ten donunce yeni kayit gorunur).
 */
export default function MesaiPlanlamaScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const user = useAuthStore((s) => s.user);

    const [sekme, setSekme] = useState<Sekme>('plan');
    const [plan, setPlan] = useState<MesaiTalebiItem[]>([]);
    const [tamam, setTamam] = useState<MesaiTalebiItem[]>([]);
    const [yuklendi, setYuklendi] = useState(false);
    const [yenileniyor, setYenileniyor] = useState(false);
    /** -/+ ya da Sil suren talep: ust uste basmalar tek istekte kalsin. */
    const [islemde, setIslemde] = useState<string | undefined>(undefined);

    const yukle = useCallback(async () => {
        const bugun = new Date();

        const [p, t] = await Promise.all([
            getMesaiTalebiListe({ durum: 'PLAN' }).catch(() => undefined),
            getMesaiTalebiListe({ durum: 'TAMAM', baslangic: gunEkle(bugun, -TAMAM_GUN), bitis: gunEkle(bugun, -1) }).catch(() => undefined),
        ]);

        // Hata mesajini baglanti katmani gosterir; basarisiz liste eski haliyle kalir.
        if (p) setPlan(sirala(p, true));
        if (t) setTamam(sirala(t, false));
        if (p || t) setYuklendi(true);
    }, []);

    useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

    const yenile = async () => {
        setYenileniyor(true);
        await yukle();
        setYenileniyor(false);
    };

    const kisiDegistir = async (t: MesaiTalebiItem, fark: number) => {
        const yeni = t.kisiSayisi + fark;

        if (yeni < 1 || islemde)
            return;

        // Davetli talepte kisi artirmak icin yeni kisi secilir.
        if (fark > 0 && t.davetModu) {
            navigation.navigate('EkMesaiDavetYonetim', { mesaiTalebiId: t.mesaiTalebiId });
            return;
        }

        setIslemde(t.mesaiTalebiId);

        try {
            const guncel = await kisiDegistirMesaiTalebi({ mesaiTalebiId: t.mesaiTalebiId, kisiSayisi: yeni });

            setPlan(onceki => onceki.map(x => (x.mesaiTalebiId === t.mesaiTalebiId ? (guncel ?? { ...x, kisiSayisi: yeni }) : x)));
        } catch {
            // Hata mesajini baglanti katmani gosterir.
        } finally {
            setIslemde(undefined);
        }
    };

    const sil = (t: MesaiTalebiItem) => {
        Alert.alert(
            'Talebi sil',
            `${trTarih(t.tarih)} · ${t.depoAdi} · ${t.aralik} talebi silinsin mi?`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        setIslemde(t.mesaiTalebiId);

                        try {
                            await silMesaiTalebi([t.mesaiTalebiId]);
                            setPlan(onceki => onceki.filter(x => x.mesaiTalebiId !== t.mesaiTalebiId));
                        } catch {
                            // Hata mesajini baglanti katmani gosterir.
                        } finally {
                            setIslemde(undefined);
                        }
                    },
                },
            ],
        );
    };

    const liste = sekme === 'plan' ? plan : tamam;

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Mesai Planlama" altBaslik={user?.nameSurname ?? undefined} onGeri={() => navigation.goBack()} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtreKap} contentContainerStyle={s.filtreler}>
                {
                    ([['plan', `Planlananlar (${plan.length})`], ['tamam', `Tamamlananlar (${tamam.length})`]] as [Sekme, string][]).map(([k, ad]) => (
                        <TouchableOpacity key={k} onPress={() => setSekme(k)} style={[s.filtre, k === sekme ? s.filtreAktif : null]} accessibilityRole="tab" accessibilityState={{ selected: k === sekme }}>
                            <Text style={[s.filtreYazi, k === sekme ? { color: c.white } : null]}>{ad}</Text>
                        </TouchableOpacity>
                    ))
                }
            </ScrollView>

            <ScrollView contentContainerStyle={s.liste} refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} />}>
                {sekme === 'tamam' ? <Yazi tur="kucuk">Son 3 ayın günü geçmiş talepleri · salt okunur</Yazi> : null}

                {
                    liste.map(t => (
                        <TalepKarti
                            key={t.mesaiTalebiId}
                            t={t}
                            tamam={sekme === 'tamam'}
                            islemde={islemde === t.mesaiTalebiId}
                            onKisi={fark => kisiDegistir(t, fark)}
                            onSil={() => sil(t)}
                            onDavet={() => navigation.navigate('EkMesaiDavetYonetim', { mesaiTalebiId: t.mesaiTalebiId })}
                        />
                    ))
                }

                {
                    yuklendi && liste.length === 0 && (
                        <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center', marginTop: 24 }}>
                            {sekme === 'plan' ? 'Planlanan talep yok.' : 'Tamamlanan talep yok.'}
                        </Yazi>
                    )
                }
            </ScrollView>

            {
                sekme === 'plan'
                    ? (
                        <View style={s.altPanel}>
                            <Dugme metin="+ Yeni Talep" onPress={() => navigation.navigate('MesaiTalebiYeni')} />
                        </View>
                    )
                    : null
            }

            <SafeAreaView edges={['bottom']} style={{ backgroundColor: sekme === 'plan' ? c.white : c.bg }} />
        </View>
    );
}

/** Talep karti: tarih · depo + rozet, aralik, musteri · bolum, PO · PO No, doluluk, yerlesenler, ayrilanlar, siparis. */
const TalepKarti = ({ t, tamam, islemde, onKisi, onSil, onDavet }: {
    t: MesaiTalebiItem
    tamam: boolean
    islemde: boolean
    onKisi: (fark: number) => void
    onSil: () => void
    onDavet: () => void
}) => {
    const eksik = eksikSayisi(t);
    const yerlesen = yerlesenSayisi(t);
    const kutular = dolulukKutulari(t);
    const ayrilanlar = (t.ayrilanlar ?? []).filter(x => !x.geldi);
    const degistirilebilir = !tamam && !t.faturali;
    const reddedenler = t.reddedenler ?? [];
    const davetSatirlari = [...(t.ayrilanlar ?? []), ...reddedenler].filter(x => x.davetDurumu != null);
    const bosYer = t.davetModu ? t.kisiSayisi - (t.ayrilanlar ?? []).length : 0;

    const rozet = tamam
        ? <Etiket metin={`${yerlesen}/${t.kisiSayisi} kişi`} ton={eksik > 0 ? 'kirmizi' : 'yesil'} />
        : <Etiket metin={eksik > 0 ? `${eksik} eksik` : 'Doldu'} ton={eksik > 0 ? 'kirmizi' : 'yesil'} />;

    const siparisMetni = t.siparis?.refNo
        ? (tamam ? `${t.siparis.refNo} · ${paraMetni(t.tutar)}` : t.siparis.refNo)
        : (tamam ? 'Sipariş oluşmadı' : 'Sipariş ilk kişiyle açılır');

    return (
        <Kart style={{ gap: 10 }}>
            <View style={s.satir}>
                <Yazi tur="govdeKalin" satir={1} style={{ flex: 1, fontWeight: '700' }}>{kisaTarih(t)} · {t.depoAdi}</Yazi>
                {rozet}
            </View>

            <View style={{ gap: 4 }}>
                <Etiket metin={t.aralik || `${t.baslangic}–${t.bitis}`} ton="mavi" />
                <Yazi tur="govde">{birlestir(t.customerName, t.divisionName)}</Yazi>
                <Yazi tur="kucuk">{birlestir(t.poName, t.poNo)}</Yazi>
            </View>

            <View style={s.satir}>
                <View style={s.kutular} accessibilityLabel={`${t.kisiSayisi} kişiden ${yerlesen} kişi yerleşti`}>
                    {kutular.map((k, i) => <View key={i} style={[s.kutu, k === 'dolu' ? s.kutuDolu : k === 'ayrilan' ? s.kutuAyrilan : null]} />)}
                </View>
                {
                    degistirilebilir
                        ? (
                            <View style={s.sayac}>
                                <TouchableOpacity style={[s.mini, t.kisiSayisi <= 1 || islemde ? s.miniPasif : null]} disabled={t.kisiSayisi <= 1 || islemde} onPress={() => onKisi(-1)} accessibilityLabel="Kişi azalt" hitSlop={6}>
                                    <Minus size={18} color={c.ink} />
                                </TouchableOpacity>
                                <Text style={s.sayi}>{t.kisiSayisi}</Text>
                                <TouchableOpacity style={[s.mini, islemde ? s.miniPasif : null]} disabled={islemde} onPress={() => onKisi(1)} accessibilityLabel="Kişi artır" hitSlop={6}>
                                    <Plus size={18} color={c.ink} />
                                </TouchableOpacity>
                            </View>
                        )
                        : <Yazi tur="kucukKalin">{t.kisiSayisi} kişi</Yazi>
                }
            </View>

            {
                (t.yerlesenler ?? []).length
                    ? (
                        <View style={{ gap: 2 }}>
                            {(t.yerlesenler ?? []).map(y => <Yazi key={y.mesaiKaydiId} tur="kucuk">{birlestir(y.ad, y.faturaAraligi)}</Yazi>)}
                        </View>
                    )
                    : null
            }

            {!t.davetModu && ayrilanlar.length ? <Yazi tur="kucuk" style={{ color: '#5B21B6' }}>Ayrılan: {ayrilanlar.map(x => x.ad).join(', ')}</Yazi> : null}

            {
                davetSatirlari.length
                    ? (
                        <View style={{ gap: 4 }}>
                            {
                                davetSatirlari.map(x => (
                                    <View key={x.personnelId} style={s.satir}>
                                        <Yazi tur="kucuk" satir={1} style={{ flex: 1 }}>{x.ad}{x.yanitSuresi ? ` · ${x.yanitSuresi}` : ''}</Yazi>
                                        <Etiket metin={davetDurumMetni(x.davetDurumu)} ton={davetDurumTonu(x.davetDurumu)} />
                                    </View>
                                ))
                            }
                        </View>
                    )
                    : null
            }

            {!tamam && bosYer > 0 ? <Yazi tur="kucuk" style={{ color: c.red }}>{bosYer} kişi reddetti ya da eksik: yerine personel seçiniz.</Yazi> : null}

            {
                degistirilebilir
                    ? <Dugme metin="Davetleri Yönet" tur="cizgili" kucuk onPress={onDavet} pasif={islemde} />
                    : null
            }

            <View style={[s.satir, s.alt]}>
                <Yazi tur="kucukKalin" style={{ flex: 1, color: t.siparis?.refNo ? c.blueDark : c.muted }}>{siparisMetni}</Yazi>
                {
                    degistirilebilir
                        ? (
                            <TouchableOpacity onPress={onSil} disabled={islemde} style={s.sil} accessibilityLabel="Talebi sil" hitSlop={6}>
                                <Trash2 size={16} color={c.red} />
                                <Text style={s.silYazi}>Sil</Text>
                            </TouchableOpacity>
                        )
                        : t.faturali && !tamam ? <Etiket metin="Faturalandı" ton="gri" /> : null
                }
            </View>
        </Kart>
    );
};

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    // Gorevlerim ile ayni sekme seridi (flexShrink 0: buyuk yazi boyutunda kirpilmasin).
    filtreKap: { flexGrow: 0, flexShrink: 0, backgroundColor: c.white, borderBottomWidth: 1, borderBottomColor: c.border },
    filtreler: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    filtre: { minHeight: 36, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#D5DAE3', backgroundColor: c.white, justifyContent: 'center' },
    filtreAktif: { backgroundColor: c.ink, borderColor: c.ink },
    filtreYazi: { fontSize: 14, fontWeight: '600', color: c.inkSoft },
    liste: { padding: 16, gap: 12, paddingBottom: 24 },
    satir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    alt: { paddingTop: 10, borderTopWidth: 1, borderTopColor: c.divider },
    kutular: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    kutu: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#C9D0DB', backgroundColor: c.white },
    kutuDolu: { backgroundColor: c.green, borderColor: c.green },
    kutuAyrilan: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
    sayac: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mini: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.white },
    miniPasif: { opacity: 0.4 },
    sayi: { minWidth: 22, textAlign: 'center', fontSize: 17, fontWeight: '700', color: c.ink, fontVariant: ['tabular-nums'] },
    sil: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E7B4B4' },
    silYazi: { fontSize: 13, fontWeight: '700', color: c.red },
    altPanel: { backgroundColor: c.white, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: c.border },
});
