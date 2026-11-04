import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Download } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { Dugme, Yazi } from '../ui';
import { surumKontrolEt } from '../services/guncellemeKontrolu';
import { guncellemeBaslat } from '../utils/cihaz';
import { SurumKontrolYaniti, guncellemeKarari, guncellemeMetni, magazaAdresiSec } from '../utils/guncelleme';

const c = theme.colors;

type Pencere = { yanit: SurumKontrolYaniti, zorunlu: boolean, adres: string | null };

/**
 * Acilista guncelleme kontrolu (04.11.2026, #545). Uygulama kokunde, gezinmenin ustunde (giris ekraninda da gorunur).
 * - Kontrol acilista ve uygulama her one geldiginde yapilir; hata / zaman asimi sessizce gecilir.
 * - Android: once Google Play uygulama ici guncelleme (IMMEDIATE). Play ekrani acilamazsa ("yok" / "hata") bu pencere.
 *   Istege bagli guncellemede Play akisi bir acilista bir kez baslatilir; zorunluda her one geliste yeniden.
 * - iOS: dogrudan bu pencere.
 * - Zorunlu: pencere kapatilamaz ("Sonra" yok, geri tusu yok sayilir). Degilse "Sonra" bu acilista tekrar sormaz (bellekte).
 */
export default function GuncellemePenceresi() {
    const [pencere, setPencere] = useState<Pencere | undefined>(undefined);

    const ertelendi = useRef(false);
    const calisiyor = useRef(false);
    const playBaslatildi = useRef(false);

    const kontrol = useCallback(async () => {
        if (calisiyor.current)
            return;

        calisiyor.current = true;

        try {
            const yanit = await surumKontrolEt();

            if (!yanit)
                return; // baglanti yok / zaman asimi: acik pencere (zorunlu) oldugu gibi kalir

            if (!yanit.guncellemeVar)
                setPencere(undefined);

            const karar = guncellemeKarari(yanit, ertelendi.current);

            if (karar === 'yok')
                return;

            if (Platform.OS === 'android' && (karar === 'zorunlu' || !playBaslatildi.current)) {
                playBaslatildi.current = true;

                if (await guncellemeBaslat() === 'baslatildi') {
                    // Play kendi ekranini gosterdi; istege bagli guncellemede kullanici vazgecerse bu acilista yine sorulmaz.
                    if (karar === 'istege')
                        ertelendi.current = true;
                    return;
                }
            }

            setPencere({ yanit, zorunlu: karar === 'zorunlu', adres: magazaAdresiSec(yanit, Platform.OS) });
        } catch {
            // Kontrol uygulamayi durdurmaz.
        } finally {
            calisiyor.current = false;
        }
    }, []);

    useEffect(() => {
        kontrol();

        const abonelik = AppState.addEventListener('change', durum => {
            if (durum === 'active')
                kontrol();
        });

        return () => abonelik.remove();
    }, [kontrol]);

    const sonra = () => {
        ertelendi.current = true;
        setPencere(undefined);
    };

    const guncelle = () => {
        if (!pencere?.adres)
            return;

        Linking.openURL(pencere.adres).catch(() => undefined);

        if (!pencere.zorunlu)
            sonra();
    };

    return (
        <Modal
            visible={!!pencere}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => { if (pencere && !pencere.zorunlu) sonra(); }}
        >
            <View style={st.zemin}>
                {
                    pencere
                        ? (
                            <View style={st.pencere}>
                                <View style={st.ikon}>
                                    <Download size={26} color={c.blue} />
                                </View>
                                <Yazi tur="altBaslik" style={{ textAlign: 'center' }}>Yeni sürüm mevcut</Yazi>
                                <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
                                    <Yazi style={st.metin}>{guncellemeMetni(pencere.yanit, pencere.adres)}</Yazi>
                                </ScrollView>
                                {pencere.adres ? <Dugme metin="Güncelle" onPress={guncelle} /> : null}
                                {!pencere.zorunlu ? <Dugme metin="Sonra" tur="cizgili" onPress={sonra} /> : null}
                            </View>
                        )
                        : null
                }
            </View>
        </Modal>
    );
}

const st = StyleSheet.create({
    zemin: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(17,24,39,0.45)' },
    pencere: { maxHeight: '85%', backgroundColor: c.white, borderRadius: 26, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, gap: 14 },
    ikon: { alignSelf: 'center', width: 52, height: 52, borderRadius: 16, backgroundColor: c.blueSoft, alignItems: 'center', justifyContent: 'center' },
    metin: { lineHeight: 22, textAlign: 'center', color: c.inkSoft },
});
