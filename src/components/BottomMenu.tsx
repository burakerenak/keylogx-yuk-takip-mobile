import { House, ListChecks, MessageCircle, User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from '@react-navigation/native';
import { theme } from "../theme/theme";
import { AppStackParamList } from "../navigation/types";
import { useKullaniciTuru } from "../utils/kullanici";
import { useMesaiKartStore } from "../store/mesaiKartStore";
import { useMesajStore } from "../store/mesajStore";
import { rozet } from "../utils/mesajlasma";

interface Props {
    /** 0: Ana Sayfa, 1: Gorevlerim, 2: Profilim, 3: Mesajlar (4.14) */
    activeIndex: number
}

// no: ekranlarin verdigi activeIndex (sira degisse de eski ekranlar ayni no ile kalir).
const sekmeler: { no: number, ad: string, ekran: 'Home' | 'Tasks' | 'Mesajlar' | 'Profile', Ikon: typeof House }[] = [
    { no: 0, ad: 'Ana Sayfa', ekran: 'Home', Ikon: House },
    { no: 1, ad: 'Görevlerim', ekran: 'Tasks', Ikon: ListChecks },
    { no: 3, ad: 'Mesajlar', ekran: 'Mesajlar', Ikon: MessageCircle },
    { no: 2, ad: 'Profilim', ekran: 'Profile', Ikon: User },
];

/**
 * Alt menu (4.3, 09.10.2026): Ana Sayfa / Gorevlerim / Profilim. 4.4: surucu kaydi olmayan (yalniz personel) kullanicida Gorevlerim gizlenir.
 * 21.10.2026: Gorevlerim sekmesi ana sayfadaki Gorevlerim kartiyla ayni kurala uyar (Arac yetkisi + surucu kaydi + mesai acik;
 * personeli olmayan yalniz surucu kullanicida her zaman). Karar ana sayfadan gelir; henuz yoksa eski kural (surucu kaydi).
 * 4.14 (#615): Mesajlar sekmesi yalniz "Mesajlar" yetkisinde (sunucu dogrular), okunmamis rozetiyle.
 */
const BottomMenu = ({ activeIndex }: Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { surucu } = useKullaniciTuru();
    const gorevlerimKarari = useMesaiKartStore((s) => s.gorevlerim);
    const gorevlerimSekmesi = surucu && (gorevlerimKarari ?? true);
    const mesajYetkisi = useMesajStore((s) => s.yetkili);
    const okunmamis = useMesajStore((s) => s.okunmamis);

    return (
        <SafeAreaView edges={['bottom']} style={s.kap}>
            <View style={s.satir}>
                {
                    sekmeler.map((x) => {
                        if (x.ekran === 'Tasks' && !gorevlerimSekmesi)
                            return null;
                        if (x.ekran === 'Mesajlar' && !mesajYetkisi)
                            return null;

                        const aktif = x.no === activeIndex;
                        const renk = aktif ? theme.colors.blue : '#6B7385';

                        return (
                            <TouchableOpacity
                                key={x.ekran}
                                style={s.sekme}
                                disabled={aktif}
                                onPress={() => navigation.navigate(x.ekran)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: aktif }}
                                accessibilityLabel={x.ekran === 'Mesajlar' && okunmamis > 0 ? `Mesajlar, ${okunmamis} okunmamış` : x.ad}
                            >
                                <View>
                                    <x.Ikon size={24} color={renk} />
                                    {x.ekran === 'Mesajlar' && okunmamis > 0 && (
                                        <View style={s.rozet}><Text style={s.rozetYazi}>{rozet(okunmamis)}</Text></View>
                                    )}
                                </View>
                                <Text style={[s.yazi, { color: renk }]}>{x.ad}</Text>
                            </TouchableOpacity>
                        );
                    })
                }
            </View>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    kap: { backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
    satir: { flexDirection: 'row', paddingTop: 8, paddingBottom: 6 },
    sekme: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
    yazi: { fontSize: 12, fontWeight: '600' },
    rozet: { position: 'absolute', top: -6, right: -12, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: theme.colors.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    rozetYazi: { color: theme.colors.white, fontSize: 10, fontWeight: '700' },
});

export default BottomMenu;
