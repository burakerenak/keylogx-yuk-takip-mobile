import { StyleSheet, TextInput as TextInput2 } from 'react-native';
import Box from './Box';
import Text from './Text';
import { theme } from '../theme/theme';
import { useEffect } from 'react';

interface Props {
    label?: string
    value?: string
    setValue?: (newValue: string) => void
    disabled?: boolean
}

const TextInput = ({ label, value, setValue, disabled }: Props) => {
    return (
        <Box>
            {
                label && (
                    <Box mb={8}>
                        <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{label}</Text>
                    </Box>
                )
            }

            <TextInput2
                onChangeText={setValue ? (val) => setValue(val?.toString()) : undefined}
                value={value?.toString() ?? ''}
                style={{
                    height: 48,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    fontSize: 16,
                    color: theme.colors.ink,
                    backgroundColor: !disabled ? theme.colors.white : theme.colors.bg
                }}
                placeholderTextColor='rgba(255,255,255,.25)'
                editable={!disabled}
            />
        </Box>
    )
}

const styles = StyleSheet.create({
    label: {
        marginBottom: 6,
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.white,
    }
});

export default TextInput;