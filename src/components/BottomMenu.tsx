import { CircleCheckBig, Package, User } from "lucide-react-native";
import Box from "./Box";
import Text from "./Text";
import { theme } from "../theme/theme";
import { Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/types";
import { useFocusEffect, useNavigation } from '@react-navigation/native';

interface Props {
    activeIndex: number
    onItem1Press?: () => void
    onItem2Press?: () => void
}

const BottomMenu = ({ onItem1Press, onItem2Press, activeIndex }: Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    return (
        <Box p={15} bg={theme.colors.bg} borderTopWidth={1} borderColor={theme.colors.border}>
            <Box flexDirection='row'>
                <Box onPress={activeIndex == 0 ? undefined : onItem1Press} flex={1} alignItems='center'>
                    <Package size={theme.fontSizes['2xl']} color={activeIndex == 0 ? theme.colors.blue : theme.colors.muted} />

                    <Box mt={5}>
                        <Text color={activeIndex == 0 ? theme.colors.blue : theme.colors.muted} fontWeight='600' fontSize={theme.fontSizes.xs}>Seferlerim</Text>
                    </Box>
                </Box>

                <Box onPress={activeIndex == 1 ? undefined : onItem2Press} flex={1} alignItems='center'>
                    <CircleCheckBig size={theme.fontSizes['2xl']} color={activeIndex == 1 ? theme.colors.blue : theme.colors.muted} />

                    <Box mt={5}>
                        <Text color={activeIndex == 1 ? theme.colors.blue : theme.colors.muted} fontWeight='600' fontSize={theme.fontSizes.xs}>Tamamlananlar</Text>
                    </Box>
                </Box>

                <Box onPress={activeIndex == 2 ? undefined : () => navigation.navigate('Profile')} flex={1} alignItems='center'>
                    <User size={theme.fontSizes['2xl']} color={activeIndex == 2 ? theme.colors.blue : theme.colors.muted} />

                    <Box mt={5}>
                        <Text color={activeIndex == 2 ? theme.colors.blue : theme.colors.muted} fontWeight='600' fontSize={theme.fontSizes.xs}>Profil</Text>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default BottomMenu;