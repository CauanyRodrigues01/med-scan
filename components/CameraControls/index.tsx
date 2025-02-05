import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { styles } from "./styles";


// Controles para a câmera
export function CameraControls ({ toggleCameraFacing, exitCamera, takePicture }) {
    return (
    <View style={styles.buttonContainer}>
      <View style={styles.buttonTop}>
        <TouchableOpacity style={styles.button} onPress={exitCamera}>
          <Ionicons name="arrow-back-outline" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Ionicons name="repeat-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>
  
      <View style={styles.buttonBottom}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <Ionicons name="ellipse" size={90} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};