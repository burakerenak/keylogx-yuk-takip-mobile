import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Check, CheckCheck, ChevronLeft, Image as ImageIcon, SendHorizontal, Users, X } from 'lucide-react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { check, PERMISSIONS, request, RESULTS, openSettings } from 'react-native-permissions';
import { AppStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { dosyaAdresi, Fotograf, fotografGonder, mesajApi } from '../api/mesaj';
import { BIREBIR, KonusmaOzeti, MesajSatiri } from '../types/mesaj.types';
import {
    ayracGerekli, basHarfler, EN_BUYUK_DOSYA, EN_UZUN_METIN, FOTO_EN_BUYUK_KENAR, FOTO_KALITE, fotografAdi, geriAlinabilir, gonderilebilir,
    gunAyraci, mesajEkle, saat,
} from '../utils/mesajlasma';
import { mesajOlayinaAbone, yaziyorBildir } from '../services/mesajBaglantisi';
import { useAuthStore } from '../store/authStore';
import { useMesajStore } from '../store/mesajStore';
import { okunmamisYenile } from '../services/mesajYoneticisi';

type Props = NativeStackScreenProps<AppStackParamList, 'Sohbet'>;

/**
 * Sohbet (4.14, 17.11.2026, #615): anlik mesaj, okundu (birebirde tik), yaziyor…, 5 dk icinde geri al (kendi mesajina
 * uzun bas), yukari kaydirinca eski mesajlar. Fotograf: kamera ya da galeri → onizleme (istege bagli aciklama) → Gonder.
 * Fotograf telefonda kucultulur (uzun kenar 1600 px, JPEG 0,8). Bildirimden acilinca konusmaId ile gelir.
 */
const SohbetScreen = ({ navigation, route }: Props) => {
    const { konusmaId } = route.params;
    const benimId = useAuthStore((s) => s.user?.id);
    const setAcikKonusma = useMesajStore((s) => s.setAcikKonusma);
    const [konusma, setKonusma] = useState<KonusmaOzeti | undefined>();
    const [mesajlar, setMesajlar] = useState<MesajSatiri[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [eskiYukleniyor, setEskiYukleniyor] = useState(false);
    const [hepsiGeldi, setHepsiGeldi] = useState(false);
    const [metin, setMetin] = useState('');
    const [gonderiliyor, setGonderiliyor] = useState(false);
    const [yaziyor, setYaziyor] = useState<string | undefined>();
    const [onizleme, setOnizleme] = useState<Fotograf | undefined>();
    const [aciklama, setAciklama] = useState('');
    const [buyukResim, setBuyukResim] = useState<string | undefined>();
    const sonYaziyor = useRef(0);
    const yaziyorSayaci = useRef<ReturnType<typeof setTimeout> | null>(null);

    const okundu = useCallback(() => { mesajApi.okundu(konusmaId).then(() => okunmamisYenile()).catch(() => undefined); }, [konusmaId]);

    const yukle = useCallback(async () => {
        try {
            const [liste, gecmis] = await Promise.all([mesajApi.konusmalar(), mesajApi.gecmis(konusmaId)]);
            const k = liste.find(x => x.id === konusmaId);
            if (!k) {
                Alert.alert('Sohbet bulunamadı', 'Bu sohbete artık erişiminiz yok.');
                navigation.goBack();
                return;
            }
            setKonusma(k);
            setMesajlar(gecmis.reduce(mesajEkle, [] as MesajSatiri[]));
            setHepsiGeldi(gecmis.length === 0);
            okundu();
        } catch {
            // Ag hatasi: ekran bos kalir, asagi cekince / yeniden baglaninca tekrar denenir.
        } finally {
            setYukleniyor(false);
        }
    }, [konusmaId, navigation, okundu]);

    useEffect(() => {
        setAcikKonusma(konusmaId);
        yukle();
        return () => setAcikKonusma(undefined);
    }, [konusmaId, setAcikKonusma, yukle]);

    useEffect(() => {
        const kapat = [
            mesajOlayinaAbone('mesaj', (m: MesajSatiri) => {
                if (m.konusmaId !== konusmaId) return;
                setMesajlar(l => mesajEkle(l, m));
                setYaziyor(undefined);
                if (m.gonderenId !== benimId) okundu();
            }),
            mesajOlayinaAbone('okundu', (v: any) => {
                if (v?.konusmaId !== konusmaId || v.userId === benimId) return;
                setMesajlar(l => l.map(m => m.gonderenId === benimId && (!v.zaman || m.zaman <= v.zaman) ? { ...m, okundu: true } : m));
            }),
            mesajOlayinaAbone('geriAlindi', (v: any) => {
                setMesajlar(l => l.map(m => m.id === v?.mesajId ? { ...m, geriAlindi: true, metin: null, dosyaUrl: null } : m));
            }),
            mesajOlayinaAbone('yaziyor', (v: any) => {
                if (v?.konusmaId !== konusmaId || v.userId === benimId) return;
                setYaziyor(konusma?.uyeler.find(u => u.userId === v.userId)?.ad ?? '');
                if (yaziyorSayaci.current) clearTimeout(yaziyorSayaci.current);
                yaziyorSayaci.current = setTimeout(() => setYaziyor(undefined), 4000);
            }),
            mesajOlayinaAbone('konusma', (v: any) => { if (v?.konusmaId === konusmaId) yukle(); }),
            mesajOlayinaAbone('yenidenBaglandi', () => yukle()),
        ];
        return () => kapat.forEach(k => k());
    }, [konusmaId, benimId, konusma, okundu, yukle]);

    const eskileriYukle = async () => {
        if (eskiYukleniyor || hepsiGeldi || mesajlar.length === 0) return;
        try {
            setEskiYukleniyor(true);
            const eski = await mesajApi.gecmis(konusmaId, mesajlar[0].id);
            if (eski.length === 0) setHepsiGeldi(true);
            else setMesajlar(l => eski.reduce(mesajEkle, l));
        } catch {
            // sonra tekrar denenir
        } finally {
            setEskiYukleniyor(false);
        }
    };

    const yaz = (t: string) => {
        setMetin(t);
        const simdi = Date.now();
        if (t.trim() && simdi - sonYaziyor.current > 3000) {
            sonYaziyor.current = simdi;
            yaziyorBildir(konusmaId);
        }
    };

    const gonder = async () => {
        if (!gonderilebilir(metin) || gonderiliyor) return;
        try {
            setGonderiliyor(true);
            const m = await mesajApi.gonder(konusmaId, metin.trim());
            setMesajlar(l => mesajEkle(l, m));
            setMetin('');
        } catch {
            // Hata penceresi istek katmaninda; metin kutuda kalir.
        } finally {
            setGonderiliyor(false);
        }
    };

    // ---- Fotograf ----
    const izinVar = async (kamera: boolean) => {
        // Android galeri: sistem fotograf secicisi izin istemez; kamera ve iOS izinli.
        if (!kamera && Platform.OS === 'android') return true;
        const izin = kamera
            ? (Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA)
            : PERMISSIONS.IOS.PHOTO_LIBRARY;
        let durum = await check(izin);
        if (durum === RESULTS.DENIED) durum = await request(izin);
        if (durum === RESULTS.GRANTED || durum === RESULTS.LIMITED) return true;
        Alert.alert(kamera ? 'Kamera izni gerekli' : 'Fotoğraf izni gerekli',
            kamera ? 'Fotoğraf çekmek için Ayarlar\'dan kamera iznini açın.' : 'Fotoğraf seçmek için Ayarlar\'dan fotoğraflara erişimi açın.',
            [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Ayarlar', onPress: () => openSettings().catch(() => undefined) }]);
        return false;
    };

    const fotografSec = async (kamera: boolean) => {
        if (!(await izinVar(kamera))) return;
        const secenek = { mediaType: 'photo' as const, maxWidth: FOTO_EN_BUYUK_KENAR, maxHeight: FOTO_EN_BUYUK_KENAR, quality: FOTO_KALITE as any, includeBase64: false, saveToPhotos: false };
        const sonuc: ImagePickerResponse = kamera ? await launchCamera(secenek) : await launchImageLibrary({ ...secenek, selectionLimit: 1 });
        if (sonuc.didCancel) return;
        if (sonuc.errorCode) {
            Alert.alert('Fotoğraf alınamadı', sonuc.errorMessage || 'Kamera ya da galeri açılamadı.');
            return;
        }
        const a = sonuc.assets?.[0];
        if (!a?.uri) return;
        if (a.fileSize && a.fileSize > EN_BUYUK_DOSYA) {
            Alert.alert('Fotoğraf çok büyük', 'Fotoğraf en fazla 10 MB olabilir.');
            return;
        }
        const tur = a.type && a.type.startsWith('image/') ? a.type : 'image/jpeg';
        const ad = a.fileName && /\.(jpe?g|png|webp|gif)$/i.test(a.fileName) ? a.fileName : fotografAdi();
        setAciklama(metin);
        setOnizleme({ uri: a.uri, ad, tur });
    };

    const fotografiGonder = async () => {
        if (!onizleme || gonderiliyor) return;
        try {
            setGonderiliyor(true);
            const m = await fotografGonder(konusmaId, aciklama.trim().slice(0, EN_UZUN_METIN), onizleme);
            setMesajlar(l => mesajEkle(l, m));
            setOnizleme(undefined);
            setAciklama('');
            setMetin('');
        } catch (e: any) {
            Alert.alert('Fotoğraf gönderilemedi', e?.message || 'İnternet bağlantınızı kontrol edip tekrar deneyin.');
        } finally {
            setGonderiliyor(false);
        }
    };

    const geriAl = (m: MesajSatiri) => {
        if (!geriAlinabilir(m, benimId)) return;
        Alert.alert('Mesajı geri al', 'Bu mesaj herkes için "Bu mesaj geri alındı" olarak görünecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Geri al', style: 'destructive', onPress: () => mesajApi.geriAl(m.id).then(() => setMesajlar(l => l.map(x => x.id === m.id ? { ...x, geriAlindi: true, metin: null, dosyaUrl: null } : x))).catch(() => undefined) },
        ]);
    };

    const grup = konusma ? konusma.tur !== BIREBIR : false;
    const ters = [...mesajlar].reverse();

    const balon = ({ item: m, index }: { item: MesajSatiri, index: number }) => {
        const benim = m.gonderenId === benimId;
        const onceki = ters[index + 1];
        const resim = m.dosyaResim && !m.geriAlindi ? dosyaAdresi(m.dosyaUrl) : undefined;
        return (
            <View>
                {ayracGerekli(onceki, m) && <View style={s.gun}><Text style={s.gunYazi}>{gunAyraci(m.zaman)}</Text></View>}
                <Pressable onLongPress={() => geriAl(m)} delayLongPress={350} style={[s.balon, benim ? s.benim : s.onun, !!resim && s.balonResim]}
                    accessibilityLabel={`${benim ? 'Siz' : m.gonderenAdi}, ${saat(m.zaman)}`}>
                    {grup && !benim && <Text style={s.gonderen}>{m.gonderenAdi}</Text>}
                    {!!resim && (
                        <TouchableOpacity onPress={() => setBuyukResim(resim)} accessibilityRole="imagebutton" accessibilityLabel="Fotoğrafı büyüt">
                            <Image source={{ uri: resim }} style={s.resim} resizeMode="cover" />
                        </TouchableOpacity>
                    )}
                    {m.geriAlindi
                        ? <Text style={[s.metin, s.geriAlindi, benim && s.metinBenim]}>Bu mesaj geri alındı</Text>
                        : (!!m.metin && <Text style={[s.metin, benim && s.metinBenim]}>{m.metin}</Text>)}
                    {!m.geriAlindi && !!m.dosyaUrl && !m.dosyaResim && <Text style={[s.metin, benim && s.metinBenim]}>📎 {m.dosyaAdi}</Text>}
                    <View style={s.alt}>
                        <Text style={[s.saat, benim && s.saatBenim]}>{saat(m.zaman)}</Text>
                        {benim && !grup && (m.okundu ? <CheckCheck size={14} color="#BFDBFE" /> : <Check size={14} color="#BFDBFE" />)}
                    </View>
                </Pressable>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#EEF3FA' }}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.white }} />
            <View style={s.baslik}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.geri} accessibilityRole="button" accessibilityLabel="Geri">
                    <ChevronLeft size={30} color={theme.colors.ink} />
                </TouchableOpacity>
                <View style={[s.avatar, grup && s.avatarGrup]}>
                    {grup ? <Users size={18} color={theme.colors.teal} /> : <Text style={s.avatarYazi}>{basHarfler(konusma?.ad ?? route.params.ad ?? '')}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.baslikAd} numberOfLines={1}>{konusma?.ad ?? route.params.ad ?? 'Sohbet'}</Text>
                    <Text style={[s.baslikAlt, yaziyor !== undefined && s.yaziyor]} numberOfLines={1}>
                        {yaziyor !== undefined ? `${grup && yaziyor ? yaziyor + ' ' : ''}yazıyor…` : grup ? `${konusma?.uyeler.length ?? ''} kişi` : ''}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {yukleniyor ? <ActivityIndicator style={{ marginTop: 40 }} color={theme.colors.blue} /> : (
                    <FlatList
                        data={ters}
                        inverted
                        keyExtractor={m => m.id}
                        renderItem={balon}
                        contentContainerStyle={{ padding: 10, gap: 4 }}
                        onEndReached={eskileriYukle}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={eskiYukleniyor ? <ActivityIndicator color={theme.colors.blue} style={{ margin: 10 }} /> : null}
                        ListEmptyComponent={<View style={s.bos}><Text style={s.bosYazi}>Henüz mesaj yok. İlk mesajı yazın.</Text></View>}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                <View style={s.giris}>
                    <TouchableOpacity onPress={() => fotografSec(true)} style={s.ikon} accessibilityRole="button" accessibilityLabel="Fotoğraf çek">
                        <Camera size={24} color={theme.colors.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fotografSec(false)} style={s.ikon} accessibilityRole="button" accessibilityLabel="Galeriden fotoğraf seç">
                        <ImageIcon size={24} color={theme.colors.blue} />
                    </TouchableOpacity>
                    <TextInput value={metin} onChangeText={yaz} placeholder="Mesaj yazın" placeholderTextColor={theme.colors.placeholder}
                        style={s.kutu} multiline maxLength={EN_UZUN_METIN} accessibilityLabel="Mesaj" />
                    <TouchableOpacity onPress={gonder} disabled={!gonderilebilir(metin) || gonderiliyor}
                        style={[s.gonder, (!gonderilebilir(metin) || gonderiliyor) && s.gonderPasif]} accessibilityRole="button" accessibilityLabel="Gönder">
                        {gonderiliyor && !onizleme ? <ActivityIndicator color={theme.colors.white} /> : <SendHorizontal size={22} color={theme.colors.white} />}
                    </TouchableOpacity>
                </View>
                <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.colors.white }} />
            </KeyboardAvoidingView>

            {/* Fotograf onizleme: istege bagli aciklama + Gonder. */}
            <Modal visible={!!onizleme} animationType="slide" onRequestClose={() => !gonderiliyor && setOnizleme(undefined)}>
                <KeyboardAvoidingView style={s.onizleme} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <SafeAreaView edges={['top']} />
                    <View style={s.onizlemeUst}>
                        <TouchableOpacity onPress={() => setOnizleme(undefined)} disabled={gonderiliyor} style={s.ikon} accessibilityRole="button" accessibilityLabel="Vazgeç">
                            <X size={28} color={theme.colors.white} />
                        </TouchableOpacity>
                        <Text style={s.onizlemeBaslik} numberOfLines={1}>{konusma?.ad ?? 'Fotoğraf gönder'}</Text>
                    </View>
                    {!!onizleme && <Image source={{ uri: onizleme.uri }} style={{ flex: 1 }} resizeMode="contain" />}
                    <View style={s.onizlemeAlt}>
                        <TextInput value={aciklama} onChangeText={setAciklama} placeholder="Açıklama ekleyin (isteğe bağlı)" placeholderTextColor="#9AA3B2"
                            style={s.onizlemeKutu} multiline maxLength={EN_UZUN_METIN} accessibilityLabel="Açıklama" />
                        <TouchableOpacity onPress={fotografiGonder} disabled={gonderiliyor} style={s.gonder} accessibilityRole="button" accessibilityLabel="Fotoğrafı gönder">
                            {gonderiliyor ? <ActivityIndicator color={theme.colors.white} /> : <SendHorizontal size={22} color={theme.colors.white} />}
                        </TouchableOpacity>
                    </View>
                    <SafeAreaView edges={['bottom']} />
                </KeyboardAvoidingView>
            </Modal>

            {/* Fotografi buyut */}
            <Modal visible={!!buyukResim} transparent animationType="fade" onRequestClose={() => setBuyukResim(undefined)}>
                <Pressable style={s.buyuk} onPress={() => setBuyukResim(undefined)} accessibilityLabel="Kapat">
                    {!!buyukResim && <Image source={{ uri: buyukResim }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
                </Pressable>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    baslik: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 60, paddingRight: 15, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    geri: { paddingHorizontal: 8, height: 60, justifyContent: 'center' },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
    avatarGrup: { backgroundColor: theme.colors.tealSoft },
    avatarYazi: { color: theme.colors.blueDark, fontWeight: '700' },
    baslikAd: { fontSize: theme.fontSizes.md, fontWeight: '700', color: theme.colors.ink },
    baslikAlt: { fontSize: theme.fontSizes.xs, color: theme.colors.muted },
    yaziyor: { color: theme.colors.green, fontStyle: 'italic' },
    gun: { alignSelf: 'center', backgroundColor: 'rgba(18,22,31,0.08)', borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginVertical: 8 },
    gunYazi: { fontSize: theme.fontSizes.xs, color: theme.colors.inkSoft, fontWeight: '600' },
    balon: { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginVertical: 2 },
    balonResim: { padding: 4 },
    benim: { alignSelf: 'flex-end', backgroundColor: theme.colors.blue, borderBottomRightRadius: 4 },
    onun: { alignSelf: 'flex-start', backgroundColor: theme.colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.border },
    gonderen: { fontSize: theme.fontSizes.xs, fontWeight: '700', color: theme.colors.teal, marginBottom: 2, paddingHorizontal: 4 },
    resim: { width: 230, height: 230, borderRadius: 10, backgroundColor: theme.colors.divider },
    metin: { fontSize: theme.fontSizes.md, color: theme.colors.ink, paddingHorizontal: 2, paddingTop: 2 },
    metinBenim: { color: theme.colors.white },
    geriAlindi: { fontStyle: 'italic', opacity: 0.75 },
    alt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2, paddingHorizontal: 2 },
    saat: { fontSize: 11, color: theme.colors.muted },
    saatBenim: { color: '#DBEAFE' },
    bos: { padding: 30, alignItems: 'center', transform: [{ scaleY: -1 }] },
    bosYazi: { color: theme.colors.muted, fontSize: theme.fontSizes.sm, textAlign: 'center' },
    giris: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
    ikon: { width: 42, height: 44, alignItems: 'center', justifyContent: 'center' },
    kutu: { flex: 1, maxHeight: 120, minHeight: 44, backgroundColor: theme.colors.bg, borderRadius: 22, paddingHorizontal: 14, paddingTop: Platform.OS === 'ios' ? 12 : 8, paddingBottom: Platform.OS === 'ios' ? 12 : 8, fontSize: theme.fontSizes.md, color: theme.colors.ink },
    gonder: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
    gonderPasif: { backgroundColor: '#93B4F5' },
    onizleme: { flex: 1, backgroundColor: '#000' },
    onizlemeUst: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, height: 56 },
    onizlemeBaslik: { flex: 1, color: theme.colors.white, fontSize: theme.fontSizes.md, fontWeight: '700' },
    onizlemeAlt: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10 },
    onizlemeKutu: { flex: 1, maxHeight: 120, minHeight: 44, backgroundColor: '#1F2633', borderRadius: 22, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: theme.fontSizes.md, color: theme.colors.white },
    buyuk: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
});

export default SohbetScreen;
