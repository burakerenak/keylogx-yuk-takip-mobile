import React from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StatusBar, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Check, ChevronDown, ChevronLeft, Eye, EyeOff, X } from 'lucide-react-native';
import { theme } from '../theme/theme';

/**
 * Ortak arayuz parcalari (4.3, 09.10.2026). Tum ekranlar ayni yazi olcegini, kart, etiket ve buton
 * gorunumunu buradan alir; yazi tipi telefonun kendi yazi tipidir.
 */

const c = theme.colors;

// ---------------------------------------------------------------- Yazi

type YaziTuru = 'baslik' | 'altBaslik' | 'govde' | 'govdeKalin' | 'kucuk' | 'kucukKalin' | 'etiket';

const yaziStilleri: Record<YaziTuru, TextStyle> = {
    baslik: { fontSize: 22, fontWeight: '700', color: c.ink },
    altBaslik: { fontSize: 18, fontWeight: '700', color: c.ink },
    govde: { fontSize: 15, color: c.ink },
    govdeKalin: { fontSize: 15, fontWeight: '600', color: c.ink },
    kucuk: { fontSize: 13, color: c.muted },
    kucukKalin: { fontSize: 13, fontWeight: '600', color: c.inkSoft },
    etiket: { fontSize: 12, fontWeight: '700', color: c.muted, letterSpacing: 0.4 },
};

export const Yazi = ({ tur = 'govde', style, children, satir }: { tur?: YaziTuru, style?: StyleProp<TextStyle>, children?: React.ReactNode, satir?: number }) => (
    <Text numberOfLines={satir} style={[yaziStilleri[tur], style]}>{children}</Text>
);

// ---------------------------------------------------------------- Ekran basligi (beyaz, koyu yazi)

export const EkranBaslik = ({ baslik, altBaslik, onGeri, sag }: { baslik: string, altBaslik?: string, onGeri?: () => void, sag?: React.ReactNode }) => (
    <View style={s.baslik}>
        <StatusBar barStyle="dark-content" backgroundColor={c.white} />
        {
            onGeri && (
                <TouchableOpacity onPress={onGeri} style={s.geri} accessibilityLabel="Geri" hitSlop={8}>
                    <ChevronLeft size={26} color={c.ink} />
                </TouchableOpacity>
            )
        }
        <View style={{ flex: 1, paddingLeft: onGeri ? 0 : 8 }}>
            <Yazi tur="altBaslik" satir={1}>{baslik}</Yazi>
            {altBaslik ? <Yazi tur="kucuk" satir={1} style={{ marginTop: 2 }}>{altBaslik}</Yazi> : null}
        </View>
        {sag}
    </View>
);

// ---------------------------------------------------------------- Kart

export const Kart = ({ children, style, onPress }: { children?: React.ReactNode, style?: StyleProp<ViewStyle>, onPress?: () => void }) => {
    if (onPress)
        return <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.kart, style]}>{children}</TouchableOpacity>;

    return <View style={[s.kart, style]}>{children}</View>;
};

// ---------------------------------------------------------------- Durum etiketi

export type EtiketTonu = 'amber' | 'mavi' | 'yesil' | 'gri' | 'turkuaz' | 'kirmizi' | 'mor';

const etiketRenkleri: Record<EtiketTonu, { bg: string, fg: string }> = {
    amber: { bg: c.amberSoft, fg: c.amberDark },
    mavi: { bg: c.blueSoft, fg: c.blueDark },
    yesil: { bg: c.greenSoft, fg: c.greenDark },
    gri: { bg: '#EEF0F4', fg: c.inkSoft },
    turkuaz: { bg: c.tealSoft, fg: c.tealDark },
    kirmizi: { bg: c.redSoft, fg: c.red },
    /** 4.6: "Yer / iş değişti" ve isimle ayrilan kisi. */
    mor: { bg: '#EDE9FE', fg: '#5B21B6' },
};

export const Etiket = ({ metin, ton = 'gri' }: { metin: string, ton?: EtiketTonu }) => (
    <View style={[s.etiket, { backgroundColor: etiketRenkleri[ton].bg }]}>
        <Text style={[s.etiketYazi, { color: etiketRenkleri[ton].fg }]}>{metin}</Text>
    </View>
);

// ---------------------------------------------------------------- Buton

export type DugmeTuru = 'mavi' | 'turkuaz' | 'koyu' | 'cizgili' | 'tehlike' | 'turuncu' | 'yumusak' | 'mor';

const dugmeRenkleri: Record<DugmeTuru, { bg: string, fg: string, border?: string }> = {
    mavi: { bg: c.blue, fg: c.white },
    turkuaz: { bg: c.teal, fg: c.white },
    koyu: { bg: c.ink, fg: c.white },
    cizgili: { bg: c.white, fg: c.ink, border: c.border },
    tehlike: { bg: c.white, fg: c.red, border: '#E7B4B4' },
    turuncu: { bg: c.orange, fg: c.white },
    /** Acik mavi zemin, koyu mavi yazi: ikincil islemler (4.3.1, Detay > Guncelle). */
    yumusak: { bg: c.blueSoft, fg: c.blueDark, border: '#BFD4FB' },
    /** Canli, yumusak mor-mavi (4.3.1, GIB'e Gonder). */
    mor: { bg: '#6366F1', fg: c.white },
};

export const Dugme = ({ metin, onPress, tur = 'mavi', pasif, kucuk, ikon, yukleniyor, style }: {
    metin: string, onPress?: () => void, tur?: DugmeTuru, pasif?: boolean, kucuk?: boolean, ikon?: React.ReactNode, yukleniyor?: boolean, style?: StyleProp<ViewStyle>
}) => {
    const r = dugmeRenkleri[tur];

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            disabled={pasif || yukleniyor}
            onPress={onPress}
            style={[
                s.dugme,
                kucuk ? s.dugmeKucuk : null,
                { backgroundColor: pasif ? '#C9D0DB' : r.bg, borderColor: pasif ? '#C9D0DB' : (r.border ?? r.bg) },
                style,
            ]}
        >
            {yukleniyor ? <ActivityIndicator color={r.fg} /> : ikon}
            <Text style={[s.dugmeYazi, kucuk ? { fontSize: 14 } : null, { color: pasif ? c.white : r.fg }]}>{metin}</Text>
        </TouchableOpacity>
    );
};

// ---------------------------------------------------------------- Bilgi satiri (etiket : deger)

export const BilgiSatiri = ({ etiket, deger, son }: { etiket: string, deger?: React.ReactNode, son?: boolean }) => (
    <View style={[s.bilgi, son ? null : s.bilgiCizgi]}>
        <Yazi tur="govde" style={{ color: c.muted }}>{etiket}</Yazi>
        <Yazi tur="govdeKalin" style={{ flexShrink: 1, textAlign: 'right' }}>{deger ?? '—'}</Yazi>
    </View>
);

// ---------------------------------------------------------------- Sifre kutusu (goz isareti)

/**
 * Sifre girisi + goz isareti (12.10.2026, Burak): kullanici girdigi sifreyi gorebilir.
 * style kutunun gorunumu (ekranin kendi kutu stili); goz sag tarafta, kutunun icinde durur.
 */
export const SifreGirdisi = ({ style, ...props }: Omit<TextInputProps, 'secureTextEntry'>) => {
    const [gorunur, setGorunur] = React.useState(false);

    return (
        <View style={{ justifyContent: 'center' }}>
            <TextInput {...props} secureTextEntry={!gorunur} autoCapitalize="none" autoCorrect={false} style={[style, { paddingRight: 48 }]} />
            <TouchableOpacity
                onPress={() => setGorunur(!gorunur)}
                style={s.goz}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={gorunur ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
                {gorunur ? <EyeOff size={20} color={c.muted} /> : <Eye size={20} color={c.muted} />}
            </TouchableOpacity>
        </View>
    );
};

// ---------------------------------------------------------------- Ayrac

export const Ayrac = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: 1, backgroundColor: c.divider }, style]} />;

// ---------------------------------------------------------------- Secim kutusu (alttan acilan liste)

export type SecimSecenegi = { deger: string, ad: string };

/**
 * 4.6 Secim kutusu (Yeni Talep formu): etiket + secili deger; dokununca alttan liste acilir, secince kapanir.
 * Liste bossa kutu pasif gorunur (bosMetin). Alttan acilan pencere oldugu icin ust guvenli alana tasmaz.
 */
export const SecimKutusu = ({ etiket, secenekler, deger, onSec, yerTutucu = 'Seçiniz', bosMetin, pasif }: {
    etiket: string
    secenekler: SecimSecenegi[]
    deger: string | undefined
    onSec: (deger: string) => void
    yerTutucu?: string
    /** Secenek yokken gosterilen metin (ornek: "Önce müşteri seçin"). */
    bosMetin?: string
    pasif?: boolean
}) => {
    const [acik, setAcik] = React.useState(false);
    const secili = secenekler.find(x => x.deger === deger);
    const kapali = pasif || secenekler.length === 0;

    return (
        <View style={{ gap: 6 }}>
            <Yazi tur="kucukKalin">{etiket}</Yazi>
            <TouchableOpacity
                activeOpacity={0.85}
                disabled={kapali}
                onPress={() => setAcik(true)}
                style={[s.secim, kapali ? { backgroundColor: c.bg } : null]}
                accessibilityRole="button"
                accessibilityLabel={`${etiket}: ${secili?.ad ?? yerTutucu}`}
            >
                <Yazi tur="govde" satir={1} style={{ flex: 1, color: secili ? c.ink : c.placeholder }}>
                    {secili?.ad ?? (secenekler.length === 0 && bosMetin ? bosMetin : yerTutucu)}
                </Yazi>
                <ChevronDown size={20} color={c.placeholder} />
            </TouchableOpacity>

            <Modal visible={acik} transparent animationType="slide" onRequestClose={() => setAcik(false)}>
                <Pressable style={s.perde} onPress={() => setAcik(false)} accessibilityLabel="Kapat" />
                <View style={s.sayfaAlt}>
                    <View style={s.sayfaBaslik}>
                        <Yazi tur="altBaslik" satir={1} style={{ flex: 1 }}>{etiket}</Yazi>
                        <TouchableOpacity onPress={() => setAcik(false)} hitSlop={8} accessibilityLabel="Kapat"><X size={24} color={c.ink} /></TouchableOpacity>
                    </View>
                    <FlatList
                        data={secenekler}
                        keyExtractor={x => x.deger}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={s.secenek}
                                onPress={() => { onSec(item.deger); setAcik(false); }}
                                accessibilityState={{ selected: item.deger === deger }}
                            >
                                <Yazi tur={item.deger === deger ? 'govdeKalin' : 'govde'} style={{ flex: 1, color: item.deger === deger ? c.blue : c.ink }}>{item.ad}</Yazi>
                                {item.deger === deger ? <Check size={20} color={c.blue} /> : null}
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={Ayrac}
                    />
                </View>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    secim: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: c.white },
    perde: { flex: 1, backgroundColor: 'rgba(16,24,38,0.45)' },
    sayfaAlt: { maxHeight: '70%', backgroundColor: c.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28 },
    sayfaBaslik: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border },
    secenek: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 15 },
    baslik: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.white, paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border, minHeight: 60 },
    geri: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    kart: { backgroundColor: c.white, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: c.border, padding: 16 },
    etiket: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radius.pill, alignSelf: 'flex-start' },
    etiketYazi: { fontSize: 12, fontWeight: '700' },
    dugme: { minHeight: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
    dugmeKucuk: { minHeight: 44, borderRadius: 12 },
    dugmeYazi: { fontSize: 16, fontWeight: '700' },
    bilgi: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 12 },
    bilgiCizgi: { borderBottomWidth: 1, borderBottomColor: c.divider },
    goz: { position: 'absolute', right: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
