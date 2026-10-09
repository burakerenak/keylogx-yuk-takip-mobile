import Box from "../components/Box";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from "../theme/theme";

interface Props {
    children: any
}

/**
 * Giris ekranlarinin cercevesi: koyu lacivert zemin (4.3, 09.10.2026). Klavye acilinca icerik yukari kayar ve
 * kaydirilabilir: iOS'ta klavye "Giris Yap" dugmesini kapatiyordu (03.10.2026). Android klavyeyi zaten pencereyi kucultup yonetiyor.
 */
const AuthLayout = ({ children }: Props) => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.navy }}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.navy} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps='handled'
                    bounces={false}
                    showsVerticalScrollIndicator={false}>
                    <Box p={24} bg={theme.colors.navy} flex={1}>
                        {children}
                    </Box>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default AuthLayout;
