import { TouchableOpacity, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

// Componente para visualizar a foto capturada
export function PhotoPreview ({ photoUri, cancelPhoto, savePhoto }) {
    return (
    <View style={styles.previewContainer}>
      <Image source={{ uri: photoUri }} style={styles.previewImage} />
      <View style={styles.previewButtons}>
        <TouchableOpacity onPress={cancelPhoto}>
          <Ionicons name="close-circle" size={50} color="red" />
        </TouchableOpacity>
        <TouchableOpacity onPress={savePhoto}>
          <Ionicons name="checkmark-circle" size={50} color="green" />
        </TouchableOpacity>
      </View>
    </View>
    );
};