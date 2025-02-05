import { ActivityIndicator, View } from "react-native";
import { styles } from "./styles";

// Componente de sobreposição de carregamento
export function LoadingOverlay({ visible }) {
    if (!visible) return null;
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
        </View>
    );
};