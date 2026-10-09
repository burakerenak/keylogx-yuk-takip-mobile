import { House, ListChecks, User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from '@react-navigation/native';
import { theme } from "../theme/theme";
import { AppStackParamList } from "../navigation/types";

interface Props {
    /** 0: Ana Sayfa, 1: Gorevlerim, 2: Profilim */
    activeIndex: number
}

const sekmeler: { ad: string, ekran: 'Home' | 'Tasks' | 'Profile', Ikon: typeof House }[] = [
    { ad: 'Ana Sayfa', ekran: 'Home', Ikon: House },
    { ad: 'Görevlerim', ekran: 'Tasks', Ikon: ListChecks },
    { ad: 'Profilim', ekran: 'Profile', Ikon: User },
];

/** Alt menu (4.3, 09.10.2026): Ana Sayfa / Gorevlerim / Profilim. */
const BottomMenu = ({ activeIndex }: Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    return (
        <SafeAreaView edges={['bottom']} style={s.kap}>
            <View style={s.satir}>
                {
                    sekmeler.map((x, i) => {
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
