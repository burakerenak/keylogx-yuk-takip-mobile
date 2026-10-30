import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Minus, Plus, X } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { AppStackParamList } from '../navigation/types';
import { getMesaiTalebiSecenekler, kaydetMesaiTalebi } from '../api/mesai';
import { MesaiTalebiSecenekler } from '../types/mesai.types';
import { Dugme, EkranBaslik, Kart, SecimKutusu, Yazi } from '../ui';
import { davetSayiHatasi, davetZorunlu } from '../utils/mesaiDavet';
import { aralikCoz, aralikMetni, bolumListesi, depoSatirlari, kendiliginden, musteriListesi, poListesi, tarihSecenekleri, varsayilanDepo } from '../utils/mesaiPlanlama';

const c = theme.colors;

/** Kisi sayisi ust siniri (yanlislikla buyuk sayi girilmesin). */
const EN_FAZLA_KISI = 99;


/**
 * 4.6 Mesai Planlama > Yeni Talep (18.10.2026; sozlesme 4.4).
 *
 * - Secenekler MesaiTalebi/Secenekler'den: depolar, PO satirlari, saat araliklari, personeller.
 * - Tarih: bugun ve sonraki 30 gun. Musteri -> Bolum -> PO · PO No kademeli (poSatirlari'ndan turetilir);
 *   ust secim degisince alttaki secim sifirlanir, tek secenek kalirsa kendiliginden secilir.
 * - Kisi sayisi en az 1. Bitisi gecmemis talepte kisi sayisi kadar personel zorunlu (#515; secilene ek mesai daveti gider):
 *   secilenler kaldirilabilir rozet; sayi tutmazsa uyari + kayit kapali (sunucu da reddeder).
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
    /** Davet edilecek personeller. */
    const [isimler, setIsimler] = useState<string[]>([]);
    const isimEkle = (id: string) => setIsimler(o => (o.includes(id) ? o : [...o, id]));
    const isimCikar = (id: string) => setIsimler(o => o.filter(x => x !== id));

    const yukle = async () => {
        setYukleniyor(true);

        try {
            const s = await getMesaiTalebiSecenekler();
            const depolar = s?.depolar ?? [];
            const araliklar = s?.araliklar ?? [];
            // #508: tek depoda yetkili kullanicida o depo; depo eslesmesine gore musteri / bolum sinirli, tek secenek kendiliginden.
            const d = varsayilanDepo(depolar, s?.varsayilanDepoId, depo);
            const kaynak = depoSatirlari(s?.poSatirlari ?? [], depolar.find(x => x.mesaiNoktasiId === d));

            setSecenekler(s);
            setDepo(d);
            setAralik(onceki => kendiliginden(araliklar.map(x => ({ deger: x, ad: x })), onceki));

            musteriSec(kendiliginden(musteriListesi(kaynak), undefined), kaynak);
        } catch {
            // Hata mesajini baglanti katmani gosterir; ekranda "Tekrar Dene" kalir.
        } finally {
            setYukleniyor(false);
        }
    };

    useEffect(() => { yukle(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const satirlar = useMemo(
        () => depoSatirlari(secenekler?.poSatirlari ?? [], (secenekler?.depolar ?? []).find(x => x.mesaiNoktasiId === depo)),
        [secenekler, depo],
    );

    /** Depo degisince musteri / bolum / PO yeni deponun eslesmesine gore sifirlanir (tek secenek kendiliginden). */
    const depoSec = (deger: string) => {
        const kaynak = depoSatirlari(secenekler?.poSatirlari ?? [], (secenekler?.depolar ?? []).find(x => x.mesaiNoktasiId === deger));
        setDepo(deger);
        musteriSec(kendiliginden(musteriListesi(kaynak), undefined), kaynak);
    };

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
    /** Secilen personel kisi sayisini gecemez. */
    const fazlaIsim = isimler.length > kisi;
    const personelZorunlu = davetZorunlu(tarih, saat?.bitis);
    const eksikPersonel = personelZorunlu && isimler.length < kisi;

    const kaydet = async () => {
        if (eksikler.length || fazlaIsim || eksikPersonel || !depo || !po || !saat || kisi < 1)
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
                ayrilanPersonelIdleri: isimler,
            });

            navigation.goBack();
        } catch {
            // Hata mesajini baglanti katmani gosterir; form oldugu gibi kalir.
        } finally {
            setKaydediliyor(false);
        }
    };

    const kisiYaz = (metin: string) => setKisiMetni(metin.replace(/\D/g, ''));
    const personelAdi = (id: string) => secenekler?.personeller?.find(x => x.personnelId === id)?.ad ?? 'Personel';

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
                                            onSec={depoSec}
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

                                        <View style={{ gap: 8 }}>
                                            {
                                                isimler.length
                                                    ? (
                                                        <View style={s.rozetler}>
                                                            {isimler.map(id => (
                                                                <TouchableOpacity key={id} style={s.rozet} onPress={() => isimCikar(id)} accessibilityRole="button" accessibilityLabel={`${personelAdi(id)} kaldır`}>
                                                                    <Text style={s.rozetYazi} numberOfLines={1}>{personelAdi(id)}</Text>
                                                                    <X size={16} color="#5B21B6" />
                                                                </TouchableOpacity>
                                                            ))}
                                                        </View>
                                                    )
                                                    : null
                                            }
                                            <SecimKutusu
                                                etiket={`Personel${personelZorunlu ? '' : ' (isteğe bağlı)'} · ${isimler.length}/${Math.max(kisi, 1)}`}
                                                secenekler={(secenekler.personeller ?? []).filter(x => !isimler.includes(x.personnelId)).map(x => ({ deger: x.personnelId, ad: x.ad }))}
                                                deger={undefined}
                                                onSec={isimEkle}
                                                yerTutucu={isimler.length >= kisi ? 'Kişi sayısı kadar seçildi' : 'Kişi ekle'}
                                                bosMetin="Eklenecek personel yok"
                                                pasif={isimler.length >= kisi}
                                            />
                                            <Yazi tur="kucuk" style={{ color: c.muted }}>Seçilen kişilere ek mesai daveti gider.</Yazi>
                                        </View>
                                    </Kart>

                                    {
                                        fazlaIsim
                                            ? <Yazi tur="kucuk" style={{ textAlign: 'center', color: c.red }}>Seçilen personel ({isimler.length}) kişi sayısından ({kisi}) fazla olamaz; kişi sayısını artırın ya da isim kaldırın.</Yazi>
                                            : eksikPersonel
                                            ? <Yazi tur="kucuk" style={{ textAlign: 'center', color: c.red }}>{davetSayiHatasi(isimler.length, kisi)}</Yazi>
                                            : eksikler.length
                                            ? <Yazi tur="kucuk" style={{ textAlign: 'center' }}>Kaydetmek için seçin: {eksikler.join(', ')}.</Yazi>
                                            : <Text style={s.not}>Davetli kişiler o saatte QR okutunca talep dolar; sipariş ilk kişiyle açılır.</Text>
                                    }

                                    <Dugme metin="Talebi Kaydet" onPress={kaydet} pasif={eksikler.length > 0 || fazlaIsim || eksikPersonel} yukleniyor={kaydediliyor} />
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
    rozetler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    rozet: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#7C3AED', maxWidth: '100%' },
    rozetYazi: { fontSize: 14, fontWeight: '600', color: '#5B21B6', flexShrink: 1 },
});
