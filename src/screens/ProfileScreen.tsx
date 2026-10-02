import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import BottomMenu from "../components/BottomMenu"
import Button from "../components/Button"
import ScrollView from "../components/ScrollView"
import Layout from "../layouts/Layout"
import { deleteUser } from "../services/userService"
import { useAuthStore } from "../store/authStore"
import { theme } from "../theme/theme"
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from "../navigation/types"

const ProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const signOut = useAuthStore((s) => s.signOut);

    const logout = async () => {
        await deleteUser();
        signOut();
    };

    return (
        <Layout title={useAuthStore.getState().user?.nameSurname ?? ''} hasPadding={false} canGoBack>
            <ScrollView>
                <Button
                    text="Çıkış Yap"
                    bg={theme.colors.blue}
                    color={theme.colors.white}
                    onPress={logout}
                />
            </ScrollView>
        </Layout>
    )
}

export default ProfileScreen;