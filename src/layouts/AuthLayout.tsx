import Box from "../components/Box";
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from "../theme/theme";

interface Props {
    children: any
}

/**
 * Giris ekranlarinin cercevesi. Klavye acilinca icerik yukari kayar ve kaydirilabilir: iOS'ta klavye
 * "Giris Yap" dugmesini kapatiyordu (03.10.2026). Android klavyeyi zaten pencereyi kucultup yonetiyor.
 */
const AuthLayout = ({ children }: Props) => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.blue }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps='handled'
                    bounces={false}
                    showsVerticalScrollIndicator={false}>
                    <Box p={15} bg={theme.colors.blue} flex={1}>
                        {children}
                    </Box>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default AuthLayout;
