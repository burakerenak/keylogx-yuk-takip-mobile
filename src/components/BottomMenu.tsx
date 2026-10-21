import { House, ListChecks, User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from '@react-navigation/native';
import { theme } from "../theme/theme";
import { AppStackParamList } from "../navigation/types";
import { useKullaniciTuru } from "../utils/kullanici";
import { useMesaiKartStore } from "../store/mesaiKartStore";

interface Props {
    /** 0: Ana Sayfa, 1: Gorevlerim, 2: Profilim */
    activeIndex: number
}

const sekmeler: { ad: string, ekran: 'Home' | 'Tasks' | 'Profile', Ikon: typeof House }[] = [
    { ad: 'Ana Sayfa', ekran: 'Home', Ikon: House },
    { ad: 'Görevlerim', ekran: 'Tasks', Ikon: ListChecks },
    { ad: 'Profilim', ekran: 'Profile', Ikon: User },
];

/**
 * Alt menu (4.3, 09.10.2026): Ana Sayfa / Gorevlerim / Profilim. 4.4: surucu kaydi olmayan (yalniz personel) kullanicida Gorevlerim gizlenir.
 * 21.10.2026: Gorevlerim sekmesi ana sayfadaki Gorevlerim kartiyla ayni kurala uyar (Arac yetkisi + surucu kaydi + mesai acik;
 * personeli olmayan yalniz surucu kullanicida her zaman). Karar ana sayfadan gelir; henuz yoksa eski kural (surucu kaydi).
 */
const BottomMenu = ({ activeIndex }: Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { surucu } = useKullaniciTuru();
    const gorevlerimKarari = useMesaiKartStore((s) => s.gorevlerim);
    const gorevlerimSekmesi = surucu && (gorevlerimKarari ?? true);

    return (
        <SafeAreaView edges={['bottom']} style={s.kap}>
            <View style={s.satir}>
                {
                    sekmeler.map((x, i) => {
                        if (x.ekran === 'Tasks' && !gorevlerimSekmesi)
                            return null;

                        const aktif = i === activeIndex;
                        const renk = aktif ? theme.colors.blue : '#6B7385';

                        return (
                            <TouchableOpacity
                                key={x.ekran}
                                style={s.sekme}
                                disabled={aktif}
                                onPress={() => navigation.navigate(x.ekran)}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: aktif }}
                            >
                                <x.Ikon size={24} color={renk} />
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
});

export default BottomMenu;
