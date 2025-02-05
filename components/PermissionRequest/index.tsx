import { View, Text, Button } from "react-native";
import { styles } from "./styles";

// Solicita permissão para usar a câmera
export function PermissionRequest({ requestPermission }) {
    return (
        <View style={ styles.permissionContainer }>
            <Text style={ styles.textPermission }>
                Nós precisamos da sua permissão para usar a câmera
            </Text>
            <Button onPress={requestPermission} title="Permitir" />
        </View>
    );
};