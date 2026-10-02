import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { login, updateFirebaseToken } from '../api/user';
import Box from '../components/Box';
import AuthLayout from '../layouts/AuthLayout';
import Text from '../components/Text';
import { theme } from '../theme/theme';
import AuthTextInput from '../components/AuthTextInput';
import Button from '../components/Button';
import { saveUser } from '../services/userService';
import { Truck } from 'lucide-react-native';
import notificationService from '../services/notificationService';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const signIn = useAuthStore((s) => s.signIn);

    const onLogin = async () => {
        var loginResponse = await login({ username, password, application: 'MOBILE' });

        await saveUser(loginResponse);

        signIn(loginResponse);

        const token = await notificationService.getToken();

        if (token)
            await updateFirebaseToken({ token: token });
    };

    return (
        <AuthLayout>
            <Box flex={1} justifyContent='center'>
                <Box borderRadius={22} aspectRatio={1} p={30} alignItems='center' alignSelf='center' bg='rgba(255,255,255,.16)'>
                    <Truck size={theme.fontSizes['4xl']} color={theme.colors.white} />
                </Box>

                <Box mt={15}>
                    <Text
                        fontWeight='bold'
                        color={theme.colors.white}
                        textAlign='center'
                        fontSize={theme.fontSizes['4xl']}>Sürücü Girişi</Text>
                </Box>

                <Box mt={8}>
                    <Text
                        textAlign='center'
                        fontSize={theme.fontSizes.md}
                        color={theme.colors.white}>Kullanıcı adı ve şifrenizle giriş yapın.</Text>
                </Box>

                <Box mt={28}>
                    <AuthTextInput value={username} onChangeText={setUsername} placeholder='Kullanıcı Adı' />
                </Box>

                <Box mt={12}>
                    <AuthTextInput value={password} onChangeText={setPassword} placeholder='Şifre' secureTextEntry />
                </Box>

                <Box mt={12}>
                    <Button onPress={onLogin} color={theme.colors.blue} bg={theme.colors.white} text='Giriş Yap' />
                </Box>
            </Box>
        </AuthLayout>
    );
}