import { useLoadingStore } from "../store/loadingStore";
import {
    View,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { theme } from "../theme/theme";


const LoadingOverlay = () => {
    const loading = useLoadingStore(
        x => x.loadingCount > 0
    );

    if (!loading)
        return null;

    return (
        <View
            style={{
                ...StyleSheet.absoluteFill,
                backgroundColor: 'rgba(0,0,0,0.35)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
            }}
        >
            <ActivityIndicator color={theme.colors.blue} size="large" />
        </View>
    );
}

export default LoadingOverlay;