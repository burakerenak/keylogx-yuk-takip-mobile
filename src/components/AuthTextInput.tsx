import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../theme/theme';

type Props = TextInputProps & {
    label?: string;
    error?: string;
};

export default function Input({ label, error, ...props }: Props) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TextInput
                style={[
                    styles.input,
                    error ? styles.inputError : null,
                ]}
                placeholderTextColor='rgba(255,255,255,.25)'
                {...props}
            />

            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // marginBottom: 12,
    },

    label: {
        marginBottom: 6,
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.white,
    },

    input: {
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,.25)',
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        color: theme.colors.white,
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
    },

    inputError: {
        borderColor: 'red',
    },

    error: {
        marginTop: 4,
        fontSize: 12,
        color: 'red',
    },
});