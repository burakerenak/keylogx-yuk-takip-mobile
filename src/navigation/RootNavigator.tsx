import React from 'react';
import { useAuthStore } from '../store/authStore';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export const RootNavigator = () => {
    const user = useAuthStore((s) => s.user);
    const hydrated = useAuthStore((s) => s.hydrated);

    if (!hydrated) return null;

    return user ? <AppNavigator /> : <AuthNavigator />;
};