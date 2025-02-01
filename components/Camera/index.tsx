// Importa os componentes necessários do pacote 'expo-camera' e outras dependências do React Native
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  FlashMode
} from 'expo-camera';

import {
  useState,
  useCallback,
  useRef
} from 'react';

import {
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator, // Indicador de carregamento
  Button,
  Image,
  Text,
} from 'react-native';

import { Ionicons } from "@expo/vector-icons"; // Ícones da biblioteca Ionicons

import { router } from "expo-router";

import * as MediaLibrary from "expo-media-library"; // Gerencia a galeria de mídia

/* COMPONENTES */

// Componente de sobreposição de carregamento
const LoadingOverlay = ({ visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="white" />
    </View>
  );
};

// Componente para visualizar a foto capturada
const PhotoPreview = ({ photoUri, cancelPhoto, savePhoto }) => (
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

// Controles para a câmera
const CameraControls = ({ toggleCameraFacing, exitCamera, takePicture }) => (
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



// Solicita permissão para usar a câmera
/*
const PermissionRequest = ({ requestPermission }) => (
  <View style={{ flex: 1, justifyContent: "center" }}>
    <Text style={{ textAlign: "center", paddingBottom: 10 }}>
      We need your permission to show the camera
    </Text>
    <Button onPress={requestPermission} title="Grant Permission" />
  </View>
);

*/


/* FUNÇÕES UTILITÁRIAS */

// Função para salvar arquivos na galeria
const saveFileToGallery = async (fileUri) => {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      console.log("Permissão para acessar a galeria não concedida.");
      return null;
    }

    const asset = await MediaLibrary.createAssetAsync(fileUri);
    const album = await MediaLibrary.getAlbumAsync("MedScan");

    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync("MedScan", asset, false);
    }

    console.log("Foto salva na galeria:", asset.uri);
    return asset.uri;
  } catch (error) {
    console.error("Erro ao salvar foto:", error);
    return null;
  }
};

/* COMPONENTE PRINCIPAL */
export default function CameraMed() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [modalIsVisible, setModalIsVisible] = useState(false);
  //const [torch, setTorch] = useState<FlashMode>("off");

  // Alterna o estado do flash (torch)
  /*
  const toggleTorch = () => {
    setTorch((prev) => (prev === "off" ? "on" : "off"));
  };
  */

  // Abre a câmera solicitando permissão
  async function handleOpenCamera() {
    try {
      const { granted } = await requestPermission();
      if (!granted) {
        return Alert.alert("Câmera", "Você precisa habilitar o uso da câmera.");
      }
      setModalIsVisible(true);
    } catch (error) {
      console.log(error);
    }
  }

  // Fecha a câmera
  function exitCamera() {
    setModalIsVisible(false);
    setPhotoUri(null);
  }

  // Captura foto
  const takePicture = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      console.log("Foto capturada:", photo.uri);

      const galleryUri = await saveFileToGallery(photo.uri);
      if (galleryUri) {
        setPhotoUri(photo.uri);
        console.log("Foto salva:", galleryUri);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para capturar foto
  /*const takePicture = useCallback(async (cameraRef, setPhotoUri, setLoading) => {
    if (!cameraRef.current) return;

    setLoading(true); // Ativa o indicador de carregamento
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      console.log("Photo captured:", photo);

      const galleryUri = await saveFileToGallery(photo.uri);
      if (galleryUri) {
        setPhotoUri(photo.uri);
        console.log(galleryUri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    } finally {
      setLoading(false); // Desativa o indicador de carregamento
    }
  }, []);*/

  // Alterna entre câmera frontal e traseira
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Salva a foto e navega para outra tela
  const savePhoto = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  // Cancela a foto e volta para a câmera
  const cancelPhoto = () => {
    setPhotoUri(null);
  };

  // Renderiza a interface do usuário
  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={handleOpenCamera} style={styles.iconButton}>
        <Ionicons name="camera-outline" size={32} color="green" />
      </TouchableOpacity>

      <Modal visible={modalIsVisible} style={{ flex: 1 }}>
        {/* Se uma foto foi capturada, exibe o preview */}
        {loading && <LoadingOverlay visible={loading} />}
        {photoUri ? (
          <PhotoPreview
            photoUri={photoUri}
            cancelPhoto={cancelPhoto}
            savePhoto={savePhoto}
          />
        ) : (
          // Exibe a câmera
          <CameraView
            ref={cameraRef} // Define a referência
            style={{ flex: 1 }}
            facing={facing}
            //flashMode={torch} // Controle do flash
            mirror={facing === 'front'}

          >
            {/* Exibe indicador de carregamento enquanto a foto é capturada */}
            <LoadingOverlay visible={loading} />
            <CameraControls
              toggleCameraFacing={toggleCameraFacing}
              exitCamera={exitCamera}
              takePicture={takePicture}
            />
          </CameraView>
        )}
      </Modal>
    </View>
  );
}

// Estilização do componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:"#000"
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between'
  },
  previewButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'space-between',
    margin: 30
  },
  buttonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  buttonBottom: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  button: {
    padding: 10,
  },
  captureButton: {
    padding: 20,
  },
});
