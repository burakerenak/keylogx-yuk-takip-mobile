import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Minus, Plus } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getMesaiTalebiSecenekler, kaydetMesaiTalebi } from '../api/mesai';
import { MesaiTalebiSecenekler } from '../types/mesai.types';
import { Dugme, EkranBaslik, Kart, SecimKutusu, Yazi } from '../ui';
import { aralikCoz, aralikMetni, bolumListesi, kendiliginden, musteriListesi, poListesi, tarihSecenekleri } from '../utils/mesaiPlanlama';

const c = theme.colors;

/** Kisi sayisi ust siniri (yanlislikla buyuk sayi girilmesin). */
const EN_FAZLA_KISI = 99;

/** Isim secimi bos deger: kimse ayrilmaz, talep gelenlerle sirayla dolar. */
const SIRAYLA = '';

/**
 * 4.6 Mesai Planlama > Yeni Talep (18.10.2026; sozlesme 4.4).
 *
 * - Secenekler MesaiTalebi/Secenekler'den: depolar, PO satirlari, saat araliklari, personeller.
 * - Tarih: bugun ve sonraki 30 gun. Musteri -> Bolum -> PO · PO No kademeli (poSatirlari'ndan turetilir);
 *   ust secim degisince alttaki secim sifirlanir, tek secenek kalirsa kendiliginden secilir.
 * - Kisi sayisi en az 1. Isim istege bagli (secilirse ayrilanPersonelIdleri tek kisi).
 * - Talebi Kaydet -> MesaiTalebi/Kaydet; basarida Mesai Planlama'ya donulur (liste odaklanmada yenilenir).
 */
export default function MesaiTalebiYeniScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    const [secenekler, setSecenekler] = useState<MesaiTalebiSecenekler | undefined>(undefined);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [kaydediliyor, setKaydediliyor] = useState(false);

    const tarihler = useMemo(() => tarihSecenekleri(new Date(), 31), []);

    const [tarih, setTarih] = useState<string>(tarihler[0].deger);
    const [depo, setDepo] = useState<string | undefined>(undefined);
    const [musteri, setMusteri] = useState<string | undefined>(undefined);
    const [bolum, setBolum] = useState<string | undefined>(undefined);
    const [po, setPo] = useState<string | undefined>(undefined);
    const [aralik, setAralik] = useState<string | undefined>(undefined);
    /** Kutu serbestce silinip yazilabilsin diye metin tutulur; sayi buradan cozulur. */
    const [kisiMetni, setKisiMetni] = useState('1');
    const kisi = Math.min(EN_FAZLA_KISI, parseInt(kisiMetni, 10) || 0);
    const setKisi = (n: number) => setKisiMetni(`${Math.min(EN_FAZLA_KISI, Math.max(1, n))}`);
    const [isim, setIsim] = useState<string>(SIRAYLA);

    const yukle = async () => {
        setYukleniyor(true);

        try {
            const s = await getMesaiTalebiSecenekler();
            const depolar = s?.depolar ?? [];
            const araliklar = s?.araliklar ?? [];
            const musteriler = musteriListesi(s?.poSatirlari ?? []);

            setSecenekler(s);
            setDepo(onceki => kendiliginden(depolar.map(x => ({ deger: x.mesaiNoktasiId, ad: x.ad })), onceki));
            setAralik(onceki => kendiliginden(araliklar.map(x => ({ deger: x, ad: x })), onceki));

            const m = kendiliginden(musteriler, undefined);
            musteriSec(m, s?.poSatirlari ?? []);
        } catch {
            // Hata mesajini baglanti katmani gosterir; ekranda "Tekrar Dene" kalir.
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => { yukle(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const satirlar = useMemo(() => secenekler?.poSatirlari ?? [], [secenekler]);

    // ------------------------------------------------------------ Kademeli secim

    const musteriler = useMemo(() => musteriListesi(satirlar), [satirlar]);
    const bolumler = useMemo(() => bolumListesi(satirlar, musteri), [satirlar, musteri]);
    const poler = useMemo(() => poListesi(satirlar, musteri, bolum), [satirlar, musteri, bolum]);

    function musteriSec(deger: string | undefined, kaynak = satirlar) {
        const b = kendiliginden(bolumListesi(kaynak, deger), undefined);

        setMusteri(deger);
        setBolum(b);
        setPo(kendiliginden(poListesi(kaynak, deger, b), undefined));
    }

    const bolumSec = (deger: string) => {
        setBolum(deger);
        setPo(kendiliginden(poListesi(satirlar, musteri, deger), undefined));
    };

    // ------------------------------------------------------------ Kaydet

    const saat = aralikCoz(aralik);
    const eksikler = [
        !tarih ? 'tarih' : null,
        !depo ? 'depo' : null,
        !po ? 'müşteri, bölüm ve PO' : null,
        !saat ? 'mesai saat aralığı' : null,
        kisi < 1 ? 'kişi sayısı' : null,
    ].filter(Boolean) as string[];

    const kaydet = async () => {
        if (eksikler.length || !depo || !po || !saat || kisi < 1)
            return;

        setKaydediliyor(true);

        try {
            await kaydetMesaiTalebi({
                tarih,
                mesaiNoktasiId: depo,
                companyPoId: po,
                kisiSayisi: kisi,
                baslangic: saat.baslangic,
                bitis: saat.bitis,
                ayrilanPersonelIdleri: isim ? [isim] : [],
            });

            navigation.goBack();
        } catch {
            // Hata mesajini baglanti katmani gosterir; form oldugu gibi kalir.
        } finally {
            setKaydediliyor(false);
        }
    };

    const kisiYaz = (metin: string) => setKisiMetni(metin.replace(/\D/g, ''));

    // ------------------------------------------------------------ Ekran

    return (
        <View style={s.sayfa}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: c.white }} />
            <EkranBaslik baslik="Yeni Talep" altBaslik="Mesai Planlama" onGeri={() => navigation.goBack()} />

            {
                yukleniyor
                    ? <ActivityIndicator color={c.blue} size="large" style={{ marginTop: 32 }} />
                    : !secenekler
                        ? (
                            <View style={s.orta}>
                                <Yazi tur="govde" style={{ color: c.muted, textAlign: 'center' }}>Talep seçenekleri yüklenemedi.</Yazi>
                                <Dugme metin="Tekrar Dene" onPress={yukle} style={{ alignSelf: 'stretch' }} />
                            </View>
                        )
                        : (
                            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                <ScrollView contentContainerStyle={s.govde} keyboardShouldPersistTaps="handled">
                                    <Kart style={{ gap: 14 }}>
                                        <SecimKutusu etiket="Tarih" secenekler={tarihler} deger={tarih} onSec={setTarih} />
                                        <SecimKutusu
                                            etiket="Depo"
                                            secenekler={(secenekler.depolar ?? []).map(x => ({ deger: x.mesaiNoktasiId, ad: x.ad }))}
                                            deger={depo}
                                            onSec={setDepo}
                                            bosMetin="Tanımlı depo yok"
                                        />
                                        <SecimKutusu etiket="Müşteri" secenekler={musteriler} deger={musteri} onSec={x => musteriSec(x)} bosMetin="Tanımlı PO yok" />
                                        <SecimKutusu etiket="Bölüm" secenekler={bolumler} deger={bolum} onSec={bolumSec} bosMetin="Önce müşteri seçin" />
                                        <SecimKutusu etiket="PO · PO No" secenekler={poler} deger={po} onSec={setPo} bosMetin="Önce bölüm seçin" />
                                        <SecimKutusu
                                            etiket="Mesai saat aralığı"
                                            secenekler={(secenekler.araliklar ?? []).map(x => ({ deger: x, ad: aralikMetni(x) }))}
                                            deger={aralik}
                                            onSec={setAralik}
                                            bosMetin="Tanımlı saat aralığı yok"
                                        />

                                        <View style={{ gap: 6 }}>
                                            <Yazi tur="kucukKalin">Kişi sayısı</Yazi>
                                            <View style={s.sayac}>
                                                <TouchableOpacity style={[s.mini, kisi <= 1 ? s.miniPasif : null]} disabled={kisi <= 1} onPress={() => setKisi(kisi - 1)} accessibilityLabel="Kişi azalt">
                                                    <Minus size={20} color={c.ink} />
                                                </TouchableOpacity>
                                                <TextInput
                                                    value={kisiMetni}
                                                    onChangeText={kisiYaz}
                                                    onBlur={() => setKisi(kisi)}
                                                    keyboardType="number-pad"
                                                    maxLength={2}
                                                    style={s.kisiKutu}
                                                    accessibilityLabel="Kişi sayısı"
                                                />
                                                <TouchableOpacity style={[s.mini, kisi >= EN_FAZLA_KISI ? s.miniPasif : null]} disabled={kisi >= EN_FAZLA_KISI} onPress={() => setKisi(kisi + 1)} accessibilityLabel="Kişi artır">
                                                    <Plus size={20} color={c.ink} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <SecimKutusu
                                            etiket="İsim (isteğe bağlı)"
                                            secenekler={[{ deger: SIRAYLA, ad: 'Sırayla doldurulsun' }, ...(secenekler.personeller ?? []).map(x => ({ deger: x.personnelId, ad: x.ad }))]}
                                            deger={isim}
                                            onSec={setIsim}
                                        />
                                    </Kart>

                                    {
                                        eksikler.length
                                            ? <Yazi tur="kucuk" style={{ textAlign: 'center' }}>Kaydetmek için seçin: {eksikler.join(', ')}.</Yazi>
                                            : <Text style={s.not}>Talep, aynı gün bu depoda saat aralığıyla kesişen Lojistik mesailerle sırayla dolar; sipariş ilk kişiyle açılır.</Text>
                                    }

                                    <Dugme metin="Talebi Kaydet" onPress={kaydet} pasif={eksikler.length > 0} yukleniyor={kaydediliyor} />
                                </ScrollView>
                            </KeyboardAvoidingView>
                        )
            }

            <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.bg }} />
        </View>
    );
}

const s = StyleSheet.create({
    sayfa: { flex: 1, backgroundColor: c.bg },
    govde: { padding: 16, gap: 14, paddingBottom: 28 },
    orta: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
    sayac: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mini: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.white },
    miniPasif: { opacity: 0.4 },
    kisiKutu: { flex: 1, height: 48, borderWidth: 1, borderColor: c.border, borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: '700', color: c.ink, backgroundColor: c.white },
    not: { fontSize: 13, color: c.muted, textAlign: 'center' },
});
