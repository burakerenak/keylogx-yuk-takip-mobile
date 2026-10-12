import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';
import { Barcode, TargetBarcodeFormat, useBarcodeScannerOutput } from 'react-native-vision-camera-barcode-scanner';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { Boxes, CameraOff, Info, Package, Truck } from 'lucide-react-native';
import { AppStackParamList } from '../navigation/types';
import { theme } from '../theme/theme';
import { BilgiSatiri, Dugme, EkranBaslik, Etiket, Kart, Yazi } from '../ui';
import { okut } from '../api/mesai';
import { IsTipi, MesaiKaydiOzet, MesaiOkutResponse } from '../types/mesai.types';
import { anlikKonum } from '../utils/konum';
import { sureMetni } from '../utils/mesai';

const c = theme.colors;

/** Mesai QR metinleri: depo KXQR:N:{kod}, arac KXQR:A:{kod}. Baska QR'lar sunucuya gonderilmez. */
const QR_ONEKI = 'KXQR:';

/** Sabit dizi: useBarcodeScannerOutput bu diziye gore cikisi yeniden olusturur. */
const FORMATLAR: TargetBarcodeFormat[] = ['qr-code'];

const KAMERA_IZNI = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

type KameraIzni = 'bekliyor' | 'var' | 'reddedildi' | 'engellendi';

type Mod =
    | { tur: 'kamera' }
    | { tur: 'isTipi', qrMetni: string, lat: number, lon: number, noktaAdi: string }
    | { tur: 'sonuc', yanit: Extract<MesaiOkutResponse, { islem: 'GIRIS' | 'CIKIS' }> };

const tarihMetni = (tarih: string | null | undefined) => {
    if (!tarih) return '';

    const [y, a, g] = tarih.split('-').map(x => parseInt(x, 10));

    return new Date(y, a - 1, g).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * QR Okut (4.4, 11.10.2026): mesai giris / cikis.
 *
 * Akis: kamera -> ilk gecerli "KXQR:" okumasi -> konum -> Mesai/Okut.
 * - Personel girisinde sunucu IS_TIPI_GEREKLI doner: Lojistik / Ambalaj secilip ayni istek isTipi ile tekrarlanir.
 * - GIRIS / CIKIS: sonuc ekrani (saat sunucudan). Personel normal + ek mesai, surucu sure gorur; fiyat yok.
 * - Konum izni yoksa okutma yapilmaz. Kamera izni yoksa Ayarlar'a yonlendirilir.
 * - Hata (gecersiz QR, uzak konum...) baglanti katmaninda uyari olarak gosterilir; tarama "Tekrar Okut" ile surer
 *   (ayni QR'in uyariyi art arda acmamasi icin otomatik yeniden tarama yapilmaz).
 */
export default function MesaiQrScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const odakta = useIsFocused();

    const [izin, setIzin] = useState<KameraIzni>('bekliyor');
    const [uygulamaAcik, setUygulamaAcik] = useState(AppState.currentState === 'active');
    const [mod, setMod] = useState<Mod>({ tur: 'kamera' });
    const [asama, setAsama] = useState<'tarama' | 'konum' | 'gonderiliyor' | 'hata'>('tarama');
    const [ipucu, setIpucu] = useState<string | undefined>(undefined);
    const [kameraHatasi, setKameraHatasi] = useState<string | undefined>(undefined);

    /** Ayni anda tek okuma: kamera her karede bildirim gonderir. */
    const islemde = useRef(false);
    const ipucuZamani = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ------------------------------------------------------------ Kamera izni

    const izinKontrol = useCallback(async (_iste: boolean) => {
        try {
            let durum = await check(KAMERA_IZNI);

            if (durum === RESULTS.DENIED && _iste)
                durum = await request(KAMERA_IZNI);

            if (durum === RESULTS.GRANTED || durum === RESULTS.LIMITED) setIzin('var');
            else if (durum === RESULTS.DENIED) setIzin('reddedildi');
            else setIzin('engellendi'); // BLOCKED ya da UNAVAILABLE
        } catch {
            setIzin('engellendi');
        }
    }, []);

    useEffect(() => { izinKontrol(true); }, [izinKontrol]);

    // Ayarlar'dan donunce izin yeniden okunur; uygulama arka plandayken kamera durur.
    useEffect(() => {
        const abonelik = AppState.addEventListener('change', durum => {
            setUygulamaAcik(durum === 'active');

            if (durum === 'active')
                izinKontrol(false);
        });

        return () => abonelik.remove();
    }, [izinKontrol]);

    useEffect(() => () => { if (ipucuZamani.current) clearTimeout(ipucuZamani.current); }, []);

    // ------------------------------------------------------------ Okuma

    const ipucuGoster = (_metin: string) => {
        setIpucu(_metin);

        if (ipucuZamani.current) clearTimeout(ipucuZamani.current);
        ipucuZamani.current = setTimeout(() => setIpucu(undefined), 2500);
    };

    const gonder = async (_qrMetni: string, _lat: number, _lon: number, _isTipi: IsTipi | null) => {
        setAsama('gonderiliyor');

        try {
            const yanit = await okut({ qrMetni: _qrMetni, lat: _lat, lon: _lon, isTipi: _isTipi });

            if (yanit?.islem === 'IS_TIPI_GEREKLI') {
                setMod({ tur: 'isTipi', qrMetni: _qrMetni, lat: _lat, lon: _lon, noktaAdi: yanit.noktaAdi });
                setAsama('tarama');
                return;
            }

            if (yanit?.islem === 'GIRIS' || yanit?.islem === 'CIKIS') {
                setMod({ tur: 'sonuc', yanit });
                setAsama('tarama');
                return;
            }

            Alert.alert('Hata', 'Sunucudan beklenmeyen yanıt alındı.');
            setMod({ tur: 'kamera' });
            setAsama('hata');
        } catch {
            // Hata mesajini baglanti katmani gosterir (QR gecersiz, depoya uzak...).
            setMod({ tur: 'kamera' });
            setAsama('hata');
        }
    };

    const qrIsle = async (_qrMetni: string) => {
        setAsama('konum');

        const konum = await anlikKonum();

        if (konum.durum === 'izinYok') {
            Alert.alert('Konum izni gerekli', 'Konum izni olmadan mesai okutulamaz.', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Ayarları Aç', onPress: () => Linking.openSettings().catch(() => undefined) },
            ]);
            setAsama('hata');
            return;
        }

        if (konum.durum === 'alinamadi') {
            Alert.alert('Konum alınamadı', 'Telefonun konum servisinin açık olduğundan emin olup tekrar deneyin.');
            setAsama('hata');
            return;
        }

        await gonder(_qrMetni, konum.lat, konum.lon, null);
    };

    const scannerOutput = useBarcodeScannerOutput({
        barcodeFormats: FORMATLAR,
        onBarcodeScanned: (_kodlar: Barcode[]) => {
            if (islemde.current)
                return;

            const degerler = _kodlar.map(x => (x.rawValue ?? '').trim()).filter(x => x);
            const gecerli = degerler.find(x => x.toUpperCase().startsWith(QR_ONEKI));

            if (!gecerli) {
                if (degerler.length)
                    ipucuGoster('Bu bir mesai QR kodu değil.');
                return;
            }

            islemde.current = true;
            qrIsle(gecerli);
        },
        onError: () => {
            // Tek karelik tarama hatasi: tarama surer, kullaniciya gosterilmez.
        },
    });

    const tekrarOkut = () => {
        setMod({ tur: 'kamera' });
        setAsama('tarama');
        islemde.current = false;
    };

    const kameraAcik = odakta && uygulamaAcik && izin === 'var' && mod.tur === 'kamera' && asama === 'tarama';

    // ------------------------------------------------------------ Ekranlar

    const kameraEkrani = () => {
        if (izin === 'bekliyor')
            return <View style={st.orta}><ActivityIndicator color={c.blue} size="large" /></View>;

        if (izin !== 'var')
            return (
                <View style={st.orta}>
                    <View style={st.izinIkon}><CameraOff size={34} color={c.muted} /></View>
                    <Yazi tur="altBaslik" style={{ textAlign: 'center' }}>Kamera izni gerekli</Yazi>
                    <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center' }}>
                        Mesai QR kodunu okutmak için kameraya izin verin.
                        {izin === 'engellendi' ? ' İzin daha önce kapatılmış; Ayarlar > İzinler > Kamera\'dan açabilirsiniz.' : ''}
                    </Yazi>
                    {
                        izin === 'reddedildi'
                            ? <Dugme metin="İzin Ver" onPress={() => izinKontrol(true)} style={st.genis} />
                            : <Dugme metin="Ayarları Aç" onPress={() => Linking.openSettings().catch(() => undefined)} style={st.genis} />
                    }
                </View>
            );

        return (
            <View style={{ flex: 1 }}>
                <View style={st.kameraKutu}>
                    <Camera
                        style={StyleSheet.absoluteFill}
                        device="back"
                        isActive={kameraAcik}
                        outputs={[scannerOutput]}
                        onError={(e: Error) => setKameraHatasi(e?.message ?? 'Kamera açılamadı.')}
                    />

                    <View pointerEvents="none" style={st.cerceveKap}>
                        <View style={st.cerceve}>
                            <View style={[st.kose, st.koseSolUst]} />
                            <View style={[st.kose, st.koseSagUst]} />
                            <View style={[st.kose, st.koseSolAlt]} />
                            <View style={[st.kose, st.koseSagAlt]} />
                        </View>
                        {ipucu ? <View style={st.ipucu}><Text style={st.ipucuYazi}>{ipucu}</Text></View> : null}
                    </View>

                    {
                        asama === 'konum' || asama === 'gonderiliyor'
                            ? (
                                <View style={st.perde}>
                                    <ActivityIndicator color={c.white} size="large" />
                                    <Text style={st.perdeYazi}>{asama === 'konum' ? 'Konum alınıyor…' : 'Kaydediliyor…'}</Text>
                                </View>
                            )
                            : null
                    }
                </View>

                <View style={st.altPanel}>
                    {
                        kameraHatasi
                            ? <Yazi tur="govde" style={{ color: c.red, textAlign: 'center' }}>Kamera açılamadı: {kameraHatasi}</Yazi>
                            : <Yazi tur="govde" style={{ textAlign: 'center', color: c.inkSoft }}>Depodaki ya da araçtaki mesai QR kodunu çerçevenin içine getirin.</Yazi>
                    }
                    <Yazi tur="kucuk" style={{ textAlign: 'center' }}>Saat sunucudan alınır; konumunuz okutma anında kontrol edilir.</Yazi>
                    {asama === 'hata' ? <Dugme metin="Tekrar Okut" onPress={tekrarOkut} style={{ marginTop: 4 }} /> : null}
                </View>
            </View>
        );
    };

    const isTipiEkrani = (_m: Extract<Mod, { tur: 'isTipi' }>) => (
        <ScrollView contentContainerStyle={st.govde}>
            <Kart style={{ alignItems: 'center', gap: 6, paddingVertical: 22 }}>
                <Yazi tur="etiket">QR NOKTASI</Yazi>
                <Yazi tur="baslik" style={{ textAlign: 'center' }}>{_m.noktaAdi}</Yazi>
                <Yazi tur="kucuk" style={{ textAlign: 'center' }}>Bugün hangi işte çalışacaksınız?</Yazi>
            </Kart>

            <Dugme metin="Lojistik" tur="mavi" ikon={<Truck size={24} color={c.white} />} style={st.buyukDugme}
                pasif={asama === 'gonderiliyor'} onPress={() => gonder(_m.qrMetni, _m.lat, _m.lon, 1)} />
            <Dugme metin="Ambalaj" tur="turkuaz" ikon={<Package size={24} color={c.white} />} style={st.buyukDugme}
                pasif={asama === 'gonderiliyor'} onPress={() => gonder(_m.qrMetni, _m.lat, _m.lon, 2)} />

            <Dugme metin="Vazgeç" tur="cizgili" onPress={tekrarOkut} pasif={asama === 'gonderiliyor'} />
        </ScrollView>
    );

    const sonucEkrani = (_m: Extract<Mod, { tur: 'sonuc' }>) => {
        const { islem, kayit, kapatilanDepoKaydi } = _m.yanit;
        const giris = islem === 'GIRIS';
        const surucu = kayit.tur === 2;
        const saat = giris ? kayit.girisSaati : (kayit.cikisSaati ?? '');

        return (
            <ScrollView contentContainerStyle={st.govde}>
                <Kart style={{ alignItems: 'center', gap: 8, paddingVertical: 24 }}>
                    <Etiket metin={giris ? 'Mesainiz başlamıştır' : 'Mesainiz sonlanmıştır'} ton={giris ? 'yesil' : 'mavi'} />
                    <Text style={st.buyukSaat}>{saat}</Text>
                    <Yazi tur="govdeKalin" style={{ textAlign: 'center' }}>{giris ? 'Giriş' : 'Çıkış'} · {kayit.noktaAdi}</Yazi>
                    <Yazi tur="kucuk">{tarihMetni(kayit.tarih)}</Yazi>
                </Kart>

                <Kart style={{ paddingVertical: 4 }}>
                    <BilgiSatiri etiket={surucu ? 'Araç' : 'QR noktası'} deger={kayit.noktaAdi} />
                    {!surucu && kayit.isTipiAdi ? <BilgiSatiri etiket="İş tipi" deger={kayit.isTipiAdi} /> : null}
                    <BilgiSatiri etiket="Giriş" deger={kayit.girisSaati} son={giris} />
                    {!giris ? <BilgiSatiri etiket="Çıkış" deger={kayit.cikisSaati} /> : null}
                    {
                        !giris && (surucu
                            ? <BilgiSatiri etiket="Süre" deger={sureMetni(kayit.sureDk)} son />
                            : <>
                                <BilgiSatiri etiket="Normal" deger={sureMetni(kayit.normalDk)} />
                                <BilgiSatiri etiket="Ek mesai" deger={<Text style={{ color: '#6D28D9' }}>{sureMetni(kayit.ekDk)}</Text>} son />
                            </>)
                    }
                </Kart>

                {kapatilanDepoKaydi ? <KapatilanDepoKaydi kayit={kapatilanDepoKaydi} /> : null}

                {
                    giris
                        ? <Yazi tur="kucuk" style={{ textAlign: 'center' }}>Mesai bitince aynı QR kodunu tekrar okutun.</Yazi>
                        : null
                }

                <Dugme metin="Tamam" tur="turkuaz" onPress={() => navigation.navigate('Home')} style={{ marginTop: 4 }} />
            </ScrollView>
        );
    };

    return (
        <View style={st.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik
                baslik={mod.tur === 'sonuc' ? (mod.yanit.islem === 'GIRIS' ? 'Mesainiz başlamıştır' : 'Mesainiz sonlanmıştır') : mod.tur === 'isTipi' ? 'İş tipi seçin' : 'QR Okut'}
                altBaslik={mod.tur === 'kamera' ? 'Mesai giriş / çıkış' : undefined}
                onGeri={() => navigation.goBack()}
            />

            {mod.tur === 'kamera' ? kameraEkrani() : null}
            {mod.tur === 'isTipi' ? isTipiEkrani(mod) : null}
            {mod.tur === 'sonuc' ? sonucEkrani(mod) : null}

            <SafeAreaView edges={['bottom']} style={{ backgroundColor: mod.tur === 'kamera' ? c.white : c.bg }} />
        </View>
    );
}

/** Arac QR'i okutuldugunda acik depo mesaisi o anda kapanir (sozlesme): bilgi satiri. */
const KapatilanDepoKaydi = ({ kayit }: { kayit: MesaiKaydiOzet }) => (
    <Kart style={{ flexDirection: 'row', gap: 12, backgroundColor: c.amberSoft, borderColor: '#F5D88A' }}>
        <Info size={22} color={c.amberDark} />
        <View style={{ flex: 1, gap: 4 }}>
            <Yazi tur="govdeKalin" style={{ color: c.amberDark }}>Depo mesainiz {kayit.cikisSaati ?? ''} itibarıyla kapatıldı.</Yazi>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Boxes size={14} color={c.amberDark} />
                <Yazi tur="kucuk" style={{ color: c.amberDark }}>
                    {kayit.noktaAdi} · Normal {sureMetni(kayit.normalDk)} · Ek mesai {sureMetni(kayit.ekDk)}
                </Yazi>
            </View>
        </View>
    </Kart>
);

const KOSE = 34;
const KALINLIK = 5;

const st = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    govde: { padding: 20, gap: 14, paddingBottom: 28 },
    orta: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
    izinIkon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF0F4', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    genis: { alignSelf: 'stretch', marginTop: 8 },
    kameraKutu: { flex: 1, backgroundColor: c.black, overflow: 'hidden' },
    cerceveKap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    cerceve: { width: 250, height: 250 },
    kose: { position: 'absolute', width: KOSE, height: KOSE, borderColor: c.white },
    koseSolUst: { top: 0, left: 0, borderTopWidth: KALINLIK, borderLeftWidth: KALINLIK, borderTopLeftRadius: 14 },
    koseSagUst: { top: 0, right: 0, borderTopWidth: KALINLIK, borderRightWidth: KALINLIK, borderTopRightRadius: 14 },
    koseSolAlt: { bottom: 0, left: 0, borderBottomWidth: KALINLIK, borderLeftWidth: KALINLIK, borderBottomLeftRadius: 14 },
    koseSagAlt: { bottom: 0, right: 0, borderBottomWidth: KALINLIK, borderRightWidth: KALINLIK, borderBottomRightRadius: 14 },
    ipucu: { marginTop: 18, backgroundColor: 'rgba(16,24,38,0.75)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    ipucuYazi: { color: c.white, fontSize: 14, fontWeight: '600' },
    perde: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(16,24,38,0.6)', alignItems: 'center', justifyContent: 'center', gap: 12 },
    perdeYazi: { color: c.white, fontSize: 16, fontWeight: '600' },
    altPanel: { backgroundColor: c.white, padding: 18, gap: 8, borderTopWidth: 1, borderTopColor: c.border },
    buyukDugme: { minHeight: 76, borderRadius: 18 },
    buyukSaat: { fontSize: 56, fontWeight: '800', color: c.ink, letterSpacing: 1 },
});
