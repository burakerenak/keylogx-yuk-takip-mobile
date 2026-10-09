/**
 * Keylogx surucu uygulamasi tema degerleri (4.3, 09.10.2026).
 * Giris ekrani koyu lacivert, ic ekranlar acik zemin; ana islem rengi mavi, teslim adimlari yesil-turkuaz.
 * Kirmizi yalniz logoda ve cikis / hata durumlarinda. Yazi tipi telefonun kendi yazi tipi (iOS SF Pro, Android Roboto).
 */
export const theme = {
    colors: {
        // Ana renkler
        blue: '#2563EB',
        blueDark: '#1E40AF',
        blueSoft: '#DBEAFE',
        teal: '#0E7C74',
        tealSoft: '#CCFBF1',
        tealDark: '#115E59',
        navy: '#101826',
        navyInput: '#182335',
        navyBorder: '#2B3850',
        navyMuted: '#A9B4C6',

        // Zemin ve yazi
        white: '#ffffff',
        bg: '#F4F6FA',
        border: '#E4E7EC',
        divider: '#EEF0F4',
        muted: '#5B6577',
        ink: '#12161F',
        inkSoft: '#3A4354',
        placeholder: '#9AA3B2',
        black: '#000',

        // Durum renkleri (etiketler)
        green: '#16A34A',
        greenSoft: '#DCFCE7',
        greenDark: '#166534',
        amberSoft: '#FEF3C7',
        amberDark: '#92400E',
        orange: '#D97706',
        red: '#B42318',
        redSoft: '#FDECEC',
    },
    fontSizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 41,
        '6xl': 48,
    },
    fontWeights: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        pill: 999,
    },
}
