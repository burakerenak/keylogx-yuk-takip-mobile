import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StickyNote } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { Dugme, Yazi } from '../ui';

const c = theme.colors;

/**
 * Siparis notu penceresi (28.10.2026, Burak; oneri C). Web'deki siparis "Not" alani surucuye yalniz okunur gosterilir:
 * Yuklerim kartindaki "Not var" rozetine dokununca alttan acilir. Pencere notun boyuna gore uzar; kayan kutu yok
 * (cok uzun notta bile ekranin %85'ine kadar uzar, ancak onu da asarsa kaydirilir).
 */
export default function SiparisNotuPenceresi({ not, refNo, onKapat }: { not?: string, refNo?: string, onKapat: () => void }) {
    return (
        <Modal visible={!!not} transparent animationType="slide" onRequestClose={onKapat} statusBarTranslucent>
            <View style={st.zemin}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onKapat} accessibilityLabel="Kapat" />
                <View style={st.pencere}>
                    <View style={st.tutamak} />
                    <View style={st.baslik}>
                        <View style={st.ikon}>
                            <StickyNote size={20} color={c.amberDark} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Yazi tur="altBaslik">Sipariş notu</Yazi>
                            <Yazi tur="kucuk">{refNo ? refNo + ' · ' : ''}yalnız okunur</Yazi>
                        </View>
                    </View>
                    <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
                        <Yazi style={st.metin}>{not}</Yazi>
                    </ScrollView>
                    <Dugme tur="cizgili" metin="Kapat" onPress={onKapat} />
                </View>
            </View>
        </Modal>
    );
}

/** Kartta notu acan rozet. */
export function NotRozeti({ onPress }: { onPress: () => void }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Sipariş notunu göster" hitSlop={6} style={({ pressed }) => [st.rozet, pressed ? { opacity: 0.7 } : null]}>
            <StickyNote size={15} color={c.amberDark} />
            <Yazi tur="kucukKalin" style={{ color: c.amberDark }}>Not var</Yazi>
        </Pressable>
    );
}

const st = StyleSheet.create({
    zemin: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.45)' },
    pencere: { maxHeight: '85%', backgroundColor: c.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, gap: 14 },
    tutamak: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D1D5DB' },
    baslik: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ikon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.amberSoft, alignItems: 'center', justifyContent: 'center' },
    metin: { lineHeight: 22 },
    rozet: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.amberSoft, borderWidth: 1, borderColor: '#F1D58C' },
});
