import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { ambarAddFileArchive, ambarDeleteFileArchive, getAmbarFileArchives } from '../api/ambar';
import { getConstantList } from '../api/constant';
import { AmbarFileArchiveListItem } from '../types/ambar.types';
import { theme } from '../theme/theme';

/**
 * Yükleme ve teslim sonrası kanıt fotoğrafı ekranı.
 *
 * Dört kutu: zorunlu kanıt + üç isteğe bağlı evrak. Fotoğraf çekilir çekilmez
 * sunucuya yüklenir; dördünü sonda tek pakette göndermek sahada bağlantı
 * zayıfken riskli. Zorunlu kanıt çekilmeden ekrandan çıkılamaz.
 *
 * 4.3 (09.10.2026, Burak): fotoğraflardan ÖNCE kişi sorulur — yüklemede "Teslim Eden", teslimde "Teslim Alan";
 * ikisi de boş gelir ve zorunludur. Girilen ad siparişin web ekranındaki aynı alana yazılır.
 */

/** AMBAR_FILE_TYPE kodları. Tür adı değişse de kutular bozulmasın diye KOD kullanılır. */
export const EVRAK_TURU = {
    IRSALIYE: '1',
    HASAR: '2',
    DIGER: '3',
    TESLIM_EVRAGI: '4',
    YUKLEME_KANITI: '5',
    TESLIM_KANITI: '6',
};

interface Kutu {
    kod: string
    ad: string
    zorunlu: boolean
    coklu: boolean
    galeri: boolean
}

const YUKLEME_KUTULARI: Kutu[] = [
    { kod: EVRAK_TURU.YUKLEME_KANITI, ad: 'Yükleme Kanıtı', zorunlu: true, coklu: false, galeri: false },
    { kod: EVRAK_TURU.IRSALIYE, ad: 'İrsaliye', zorunlu: false, coklu: false, galeri: true },
    { kod: EVRAK_TURU.HASAR, ad: 'Hasar', zorunlu: false, coklu: true, galeri: true },
    { kod: EVRAK_TURU.DIGER, ad: 'Diğer', zorunlu: false, coklu: true, galeri: true },
];

const TESLIM_KUTULARI: Kutu[] = [
    { kod: EVRAK_TURU.TESLIM_KANITI, ad: 'Teslim Kanıtı', zorunlu: true, coklu: false, galeri: false },
    { kod: EVRAK_TURU.TESLIM_EVRAGI, ad: 'Teslim Evrağı', zorunlu: false, coklu: false, galeri: true },
    { kod: EVRAK_TURU.HASAR, ad: 'Hasar', zorunlu: false, coklu: true, galeri: true },
    { kod: EVRAK_TURU.DIGER, ad: 'Diğer', zorunlu: false, coklu: true, galeri: true },
];

interface Props {
    isShown: boolean
    ambarId: string | undefined
    mod: 'yukleme' | 'teslim'
    /** kisi: yuklemede Teslim Eden, teslimde Teslim Alan (bos olamaz). */
    onTamamla: (kisi: string) => void
    onKapat: () => void
}

const KanitFotograflari = ({ isShown, ambarId, mod, onTamamla, onKapat }: Props) => {
    const kutular = mod === 'yukleme' ? YUKLEME_KUTULARI : TESLIM_KUTULARI;

    // iOS'ta tam sayfa Modal ekranin en ustunden baslar; baslik ve alt dugme guvenli alan kadar iceri alinir.
    // Android'de Modal durum cubugunun altinda acildigi icin ek pay verilmez (cift bosluk olmasin).
    const insets = useSafeAreaInsets();
    const ustPay = Platform.OS === 'ios' ? insets.top : 0;
    const altPay = Platform.OS === 'ios' ? insets.bottom : 0;

    const [dosyalar, setDosyalar] = useState<AmbarFileArchiveListItem[]>([]);
    const [turler, setTurler] = useState<{ constantId: string, additionalValue1: string }[]>([]);
    const [yukleniyor, setYukleniyor] = useState(false);
    const [islemdekiKod, setIslemdekiKod] = useState<string | undefined>(undefined);

    // 1. adim kisi (Teslim Eden / Teslim Alan), 2. adim fotograflar.
    const [adim, setAdim] = useState<'kisi' | 'foto'>('kisi');
    const [kisi, setKisi] = useState('');
    const kisiEtiketi = mod === 'yukleme' ? 'Teslim Eden' : 'Teslim Alan';
    const vurgu = mod === 'yukleme' ? theme.colors.blue : theme.colors.teal;

    useEffect(() => {
        if (isShown && ambarId)
            ilkYukleme(ambarId);

        if (isShown) {
            setAdim('kisi');
            setKisi('');
        }
    }, [isShown, ambarId]);

    const ilkYukleme = async (_ambarId: string) => {
        try {
            setYukleniyor(true);

            const sabitler = await getConstantList({ code: 'AMBAR_FILE_TYPE' });

            setTurler((sabitler ?? []).map((x: any) => ({
                constantId: x.constantId,
                additionalValue1: x.additionalValue1,
            })));

            // Ekran kapanip acilsa da daha once cekilenler kutularinda gorunur.
            setDosyalar(await getAmbarFileArchives(_ambarId) ?? []);
        } catch {
            Alert.alert('Hata', 'Fotoğraflar okunamadı. İnterneti kontrol edip tekrar deneyin.');
        } finally {
            setYukleniyor(false);
        }
    };

    const turIdBul = (_kod: string) => turler.find(x => x.additionalValue1 === _kod)?.constantId;

    const kutununDosyalari = (_kod: string) => dosyalar.filter(x => x.fileTypeKey === _kod);

    const eksikZorunlular = kutular.filter(k => k.zorunlu && kutununDosyalari(k.kod).length === 0);

    const izinIste = async (_kamera: boolean) => {
        const izin = _kamera
            ? (Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA)
            : (Platform.OS === 'ios' ? PERMISSIONS.IOS.PHOTO_LIBRARY : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);

        let durum = await check(izin);

        if (durum === RESULTS.DENIED)
            durum = await request(izin);

        if (durum === RESULTS.DENIED || durum === RESULTS.BLOCKED) {
            Alert.alert('Hata', _kamera ? 'Kamera izni verilmedi.' : 'Galeri izni verilmedi.');
            return false;
        }

        return true;
    };

    const fotografAl = async (_kutu: Kutu, _kamera: boolean) => {
        if (!ambarId)
            return;

        if (!(await izinIste(_kamera)))
            return;

        const sonuc = _kamera
            ? await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.8 })
            : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.8 });

        if (sonuc.didCancel || sonuc.errorCode)
            return;

        const b64 = sonuc.assets?.[0]?.base64;

        if (!b64)
            return;

        const turId = turIdBul(_kutu.kod);

        if (!turId) {
            Alert.alert('Hata', `"${_kutu.ad}" evrak türü tanımlı değil. Yöneticinize bildirin.`);
            return;
        }

        try {
            setIslemdekiKod(_kutu.kod);

            const eklenen = await ambarAddFileArchive({ ambarId, fileTypeId: turId, b64 });

            setDosyalar(oncekiler => [...oncekiler, {
                fileArchiveId: eklenen.fileArchiveId,
                fileTypeId: turId,
                fileTypeName: _kutu.ad,
                fileTypeKey: _kutu.kod,
                fileName: eklenen.fileName,
                url: eklenen.url,
                description: undefined,
            }]);
        } catch {
            Alert.alert('Hata', 'Fotoğraf yüklenemedi. İnterneti kontrol edip tekrar deneyin.');
        } finally {
            setIslemdekiKod(undefined);
        }
    };

    const kaynakSec = (_kutu: Kutu) => {
        const secenekler: any[] = [
            { text: 'Kamera ile çek', onPress: () => fotografAl(_kutu, true) },
        ];

        if (_kutu.galeri)
            secenekler.push({ text: 'Galeriden seç', onPress: () => fotografAl(_kutu, false) });

        secenekler.push({ text: 'Vazgeç', style: 'cancel' });

        Alert.alert(
            _kutu.ad,
            _kutu.galeri
                ? 'Fotoğrafı nereden almak istiyorsunuz?'
                : 'Kanıt fotoğrafı yerinde çekilmelidir.',
            secenekler,
        );
    };

    const fotografSil = (_dosya: AmbarFileArchiveListItem) => {
        if (!ambarId)
            return;

        Alert.alert('Fotoğrafı sil', 'Bu fotoğraf silinecek. Emin misiniz?', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setIslemdekiKod(_dosya.fileTypeKey);

                        await ambarDeleteFileArchive({ ambarId, fileArchiveId: _dosya.fileArchiveId });

                        setDosyalar(oncekiler => oncekiler.filter(x => x.fileArchiveId !== _dosya.fileArchiveId));
                    } catch {
                        Alert.alert('Hata', 'Fotoğraf silinemedi.');
                    } finally {
                        setIslemdekiKod(undefined);
                    }
                },
            },
        ]);
    };

    // Cikis kilitli: zorunlu kanit cekilmeden ekrandan cikilamaz, islem kaydedilmez.
    const kapatmayiDene = () => {
        if (eksikZorunlular.length === 0) {
            onKapat();
            return;
        }

        Alert.alert(
            'Önce zorunlu fotoğrafı çekin',
            `${eksikZorunlular.map(x => x.ad).join(', ')} çekilmeden bu ekrandan çıkılamaz. İşlem henüz kaydedilmedi.`,
            [{ text: 'Anladım' }],
        );
    };

    const baslik = adim === 'kisi' ? (mod === 'yukleme' ? 'Yükleme Yapıldı' : 'Teslim Et') : (mod === 'yukleme' ? 'Yükleme Kanıtı' : 'Teslim Kanıtı');

    // 2. adimda geri tusu 1. adima doner; 1. adimda cikis kilidi (zorunlu fotograf) aynen gecerli.
    const geriBas = () => {
        if (adim === 'foto') {
            setAdim('kisi');
            return;
        }

        kapatmayiDene();
    };

    const tamamTonu = mod === 'yukleme' ? theme.colors.blueDark : theme.colors.greenDark;
    const tamamZemin = mod === 'yukleme' ? theme.colors.blueSoft : theme.colors.greenSoft;

    return (
        <Modal visible={isShown} animationType="slide" onRequestClose={geriBas}>
            <View style={s.sayfa}>
                <View style={[s.baslik, { paddingTop: 10 + ustPay }]}>
                    <TouchableOpacity onPress={geriBas} style={s.geri} accessibilityLabel="Geri">
                        <Text style={s.geriYazi}>‹</Text>
                    </TouchableOpacity>
                    <Text style={s.baslikYazi}>{baslik}</Text>
                </View>

                <View style={s.adimlar}>
                    {
                        adim === 'kisi'
                            ? <View style={[s.adimNo, { backgroundColor: vurgu }]}><Text style={s.adimNoYazi}>1</Text></View>
                            : <View style={[s.adimNo, { backgroundColor: tamamZemin }]}><Text style={[s.adimNoYazi, { color: tamamTonu }]}>✓</Text></View>
                    }
                    <Text style={[s.adimYazi, adim === 'foto' ? { color: tamamTonu } : null]} numberOfLines={1}>
                        {adim === 'kisi' ? kisiEtiketi : kisiEtiketi + ': ' + kisi.trim()}
                    </Text>
                    <View style={[s.adimCizgi, adim === 'foto' ? { backgroundColor: vurgu } : null]} />
                    <View style={[s.adimNo, { backgroundColor: adim === 'foto' ? vurgu : theme.colors.border }]}>
                        <Text style={[s.adimNoYazi, adim === 'foto' ? null : { color: theme.colors.muted }]}>2</Text>
                    </View>
                    <Text style={[s.adimYazi, adim === 'foto' ? null : { color: theme.colors.muted, fontWeight: '600' }]}>Fotoğraflar</Text>
                </View>

                {
                    adim === 'kisi' && (
                        <React.Fragment>
                            <ScrollView contentContainerStyle={s.kisiGovde} keyboardShouldPersistTaps="handled">
                                <Text style={s.soru}>{mod === 'yukleme' ? 'Yükü kim teslim etti?' : 'Yükü kim teslim aldı?'}</Text>
                                <Text style={s.soruAlt}>
                                    {mod === 'yukleme' ? 'Yükü size veren kişinin' : 'Yükü teslim alan kişinin'} adı soyadı siparişin "{kisiEtiketi}" alanına yazılır.
                                </Text>
                                <Text style={s.kisiEtiket}>{kisiEtiketi} <Text style={{ color: theme.colors.red }}>*</Text></Text>
                                <TextInput
                                    value={kisi}
                                    onChangeText={setKisi}
                                    placeholder="Ad soyad"
                                    placeholderTextColor={theme.colors.placeholder}
                                    autoCapitalize="words"
                                    returnKeyType="next"
                                    onSubmitEditing={() => { if (kisi.trim()) setAdim('foto'); }}
                                    style={[s.kisiKutu, { borderColor: kisi.trim() ? vurgu : '#E4A0A0' }]}
                                />
                                {!kisi.trim() && <Text style={s.kisiHata}>{mod === 'yukleme' ? 'Yükü teslim eden kişinin adını girin.' : 'Teslim alan kişinin adını girin.'}</Text>}
                            </ScrollView>

                            <View style={[s.alt, { paddingBottom: 14 + altPay }]}>
                                <TouchableOpacity
                                    style={[s.tamamla, { backgroundColor: vurgu }, !kisi.trim() ? s.tamamlaPasif : null]}
                                    disabled={!kisi.trim()}
                                    onPress={() => setAdim('foto')}
                                >
                                    <Text style={s.tamamlaYazi}>Devam: Fotoğraf Çek</Text>
                                </TouchableOpacity>
                            </View>
                        </React.Fragment>
                    )
                }

                {adim === 'foto' && (<React.Fragment>
                <ScrollView contentContainerStyle={s.govde}>
                    <View style={s.uyari}>
                        <Text style={s.uyariYazi}>
                            <Text style={s.kalin}>{kutular[0].ad}</Text> zorunludur. Diğerleri isteğe bağlıdır.
                        </Text>
                    </View>

                    {
                        yukleniyor
                            ? <ActivityIndicator size="large" color={theme.colors.blue} style={{ marginTop: 40 }} />
                            : (
                                <View style={s.izgara}>
                                    {
                                        kutular.map(kutu => {
                                            const dosyaListesi = kutununDosyalari(kutu.kod);
                                            const ilk = dosyaListesi[0];
                                            const islemde = islemdekiKod === kutu.kod;

                                            return (
                                                <TouchableOpacity
                                                    key={kutu.kod}
                                                    style={[s.kutu, ilk ? s.kutuDolu : (kutu.zorunlu ? s.kutuZorunlu : null)]}
                                                    activeOpacity={0.8}
                                                    disabled={islemde || (!!ilk && !kutu.coklu)}
                                                    onPress={() => kaynakSec(kutu)}
                                                >
                                                    {
                                                        islemde && (
                                                            <View style={s.ortaKatman}>
                                                                <ActivityIndicator color={theme.colors.white} />
                                                            </View>
                                                        )
                                                    }

                                                    {
                                                        ilk
                                                            ? (
                                                                <React.Fragment>
                                                                    <Image source={{ uri: ilk.url }} style={s.resim} />

                                                                    <TouchableOpacity style={s.sil} onPress={() => fotografSil(ilk)}>
                                                                        <Text style={s.silYazi}>×</Text>
                                                                    </TouchableOpacity>

                                                                    {
                                                                        kutu.coklu && dosyaListesi.length > 1 && (
                                                                            <View style={s.rozet}>
                                                                                <Text style={s.rozetYazi}>{dosyaListesi.length}</Text>
                                                                            </View>
                                                                        )
                                                                    }

                                                                    <View style={s.etiket}>
                                                                        <Text style={s.etiketYazi}>{kutu.ad}</Text>
                                                                        {kutu.coklu && <Text style={s.etiketYazi}>+ ekle</Text>}
                                                                    </View>
                                                                </React.Fragment>
                                                            )
                                                            : (
                                                                <React.Fragment>
                                                                    <Text style={s.arti}>+</Text>
                                                                    <Text style={s.kutuAd}>
                                                                        {kutu.ad}{kutu.zorunlu ? ' *' : ''}
                                                                    </Text>
                                                                    <Text style={s.ipucu}>
                                                                        {kutu.galeri ? 'kamera / galeri' : 'yalnız kamera'}
                                                                    </Text>
                                                                </React.Fragment>
                                                            )
                                                    }
                                                </TouchableOpacity>
                                            );
                                        })
                                    }
                                </View>
                            )
                    }
                </ScrollView>

                <View style={[s.alt, { paddingBottom: 14 + altPay }]}>
                    <Text style={s.durum}>
                        {
                            eksikZorunlular.length > 0
                                ? `Eksik: ${eksikZorunlular.map(x => x.ad).join(', ')}`
                                : `${dosyalar.length} fotoğraf eklendi`
                        }
                    </Text>

                    <TouchableOpacity
                        style={[s.tamamla, { backgroundColor: vurgu }, eksikZorunlular.length > 0 ? s.tamamlaPasif : null]}
                        disabled={eksikZorunlular.length > 0}
                        onPress={() => onTamamla(kisi.trim())}
                    >
                        <Text style={s.tamamlaYazi}>
                            {mod === 'yukleme' ? 'Yüklemeyi Tamamla' : 'Teslimi Tamamla'}
                        </Text>
                    </TouchableOpacity>
                </View>
                </React.Fragment>)}
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: theme.colors.bg },
    baslik: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    geri: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    geriYazi: { color: theme.colors.ink, fontSize: 30, lineHeight: 32 },
    baslikYazi: { color: theme.colors.ink, fontSize: 18, fontWeight: '700', marginLeft: 2 },
    adimlar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.colors.white },
    adimNo: { width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
    adimNoYazi: { color: theme.colors.white, fontSize: 14, fontWeight: '700' },
    adimYazi: { fontSize: 14, fontWeight: '700', color: theme.colors.ink, flexShrink: 1 },
    adimCizgi: { flex: 1, minWidth: 16, height: 2, backgroundColor: '#D5DAE3' },
    kisiGovde: { padding: 20, gap: 10 },
    soru: { fontSize: 22, fontWeight: '700', color: theme.colors.ink },
    soruAlt: { fontSize: 15, color: theme.colors.muted, lineHeight: 21 },
    kisiEtiket: { fontSize: 14, fontWeight: '600', color: theme.colors.ink, marginTop: 14 },
    kisiKutu: { height: 54, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 17, color: theme.colors.ink, backgroundColor: theme.colors.white },
    kisiHata: { fontSize: 13, color: theme.colors.red },
    govde: { padding: 14, paddingBottom: 30 },
    uyari: { backgroundColor: '#fff4de', borderRadius: 8, padding: 12, marginBottom: 14 },
    uyariYazi: { color: '#7a5c00', fontSize: 13, lineHeight: 19 },
    kalin: { fontWeight: '700' },
    izgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    kutu: {
        width: '48%', aspectRatio: 1, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed',
        borderColor: theme.colors.border, backgroundColor: '#fcfcfd', marginBottom: 14,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    kutuZorunlu: { borderColor: '#f9c5d3' },
    kutuDolu: { borderStyle: 'solid', borderColor: theme.colors.green, backgroundColor: theme.colors.white },
    arti: { fontSize: 30, color: theme.colors.placeholder, lineHeight: 34 },
    kutuAd: { fontSize: 13, fontWeight: '600', color: theme.colors.ink, textAlign: 'center', paddingHorizontal: 8, marginTop: 4 },
    ipucu: { fontSize: 11, color: theme.colors.muted, marginTop: 3 },
    resim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    ortaKatman: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
    sil: {
        position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(24,28,50,0.75)', alignItems: 'center', justifyContent: 'center', zIndex: 2,
    },
    silYazi: { color: theme.colors.white, fontSize: 17, lineHeight: 19 },
    rozet: { position: 'absolute', top: 6, left: 6, backgroundColor: theme.colors.blue, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, zIndex: 2 },
    rozetYazi: { color: theme.colors.white, fontSize: 11, fontWeight: '700' },
    etiket: {
        position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(24,28,50,0.78)',
        paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2,
    },
    etiketYazi: { color: theme.colors.white, fontSize: 11, fontWeight: '600' },
    alt: { borderTopWidth: 1, borderTopColor: theme.colors.border, padding: 14, backgroundColor: theme.colors.white },
    durum: { fontSize: 12.5, color: theme.colors.muted, textAlign: 'center', marginBottom: 10 },
    tamamla: { backgroundColor: theme.colors.green, borderRadius: 14, minHeight: 54, justifyContent: 'center', alignItems: 'center' },
    tamamlaPasif: { backgroundColor: '#d9dce4' },
    tamamlaYazi: { color: theme.colors.white, fontSize: 17, fontWeight: '700' },
});

export default KanitFotograflari;
