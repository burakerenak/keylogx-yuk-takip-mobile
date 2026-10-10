import React from 'react';
import { ActivityIndicator, StatusBar, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
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

export type EtiketTonu = 'amber' | 'mavi' | 'yesil' | 'gri' | 'turkuaz' | 'kirmizi';

const etiketRenkleri: Record<EtiketTonu, { bg: string, fg: string }> = {
    amber: { bg: c.amberSoft, fg: c.amberDark },
    mavi: { bg: c.blueSoft, fg: c.blueDark },
    yesil: { bg: c.greenSoft, fg: c.greenDark },
    gri: { bg: '#EEF0F4', fg: c.inkSoft },
    turkuaz: { bg: c.tealSoft, fg: c.tealDark },
    kirmizi: { bg: c.redSoft, fg: c.red },
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

// ---------------------------------------------------------------- Ayrac

export const Ayrac = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: 1, backgroundColor: c.divider }, style]} />;

const s = StyleSheet.create({
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
});
