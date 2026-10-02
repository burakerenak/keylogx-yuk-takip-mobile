import Box from "../components/Box";
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from "../theme/theme";

interface Props {
    children: any
}

const AuthLayout = ({ children }: Props) => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.blue }}>
            <Box p={15} bg={theme.colors.blue} flex={1}>
                {children}
            </Box>
        </SafeAreaView>
    )
}

export default AuthLayout;