// Importa os componentes necessários do pacote 'expo-camera' e outras dependências do React Native
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  //FlashMode
} from 'expo-camera';

import {
  useState,
  useRef
} from 'react';

import {
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { Ionicons } from "@expo/vector-icons"; // Ícones da biblioteca Ionicons

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from "expo-media-library"; // Gerencia a galeria de mídia
import { LoadingOverlay } from '../LoadingOverlay';
import { PhotoPreview } from '../PhotoPreview';
import { CameraControls } from '../CameraControls';

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

  // Exclui a foto temporária se a permissão for negada
  const deleteTemporaryPhoto = async (uri) => {
    try {
      await FileSystem.deleteAsync(uri);
      console.log("🗑️ Foto temporária excluída:", uri);
    } catch (error) {
      console.error("❌ Erro ao excluir foto temporária:", error);
    }
  };

  // Fecha a câmera
  function exitCamera() {
    setModalIsVisible(false);
    setPhotoUri(null);
  }

  const checkPermissions = async () => {
    const { status } = await MediaLibrary.getPermissionsAsync();
    console.log("📌 Permissão atual:", status);
    return status === "granted";
  };

  // Captura a foto sem salvar automaticamente na galeria
  const takePicture = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      console.log("📸 Foto capturada:", photo.uri);

      setPhotoUri(photo.uri); // Apenas armazena o URI da foto
    } catch (error) {
      console.error("❌ Erro ao tirar foto:", error);
    } finally {
      setLoading(false);
    }
  };

  // Salva a foto na galeria quando o usuário confirma
  const savePhoto = async () => {
    if (!photoUri) {
      console.log("⚠️ Nenhuma foto disponível para salvar.");
      return;
    }

    setLoading(true);
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.warn("⚠️ Permissão para acessar a galeria não concedida. Foto não salva.");
        await deleteTemporaryPhoto(photoUri);
        return;
      }

      const galleryUri = await saveFileToGallery(photoUri);
      if (galleryUri) {
        console.log("✅ Foto confirmada e salva na galeria:", galleryUri);
        setPhotoUri(null);
        exitCamera();
      } else {
        console.warn("⚠️ A foto não foi salva na galeria.");
        await deleteTemporaryPhoto(photoUri);
      }
    } catch (error) {
      console.error("❌ Erro ao salvar a foto:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar o arquivo na galeria
  const saveFileToGallery = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.error("❌ Arquivo não encontrado:", uri);
        return null;
      }

      console.log("📌 Solicitando permissão...");
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log("📌 Status da permissão após solicitação:", status);

      if (status !== "granted") {
        console.warn("⚠️ Permissão negada. Foto não será salva.");
        return null;
      }

      console.log("📌 Criando asset...");
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log("📌 Asset criado:", asset.uri);

      const album = await MediaLibrary.getAlbumAsync("MedScan");
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        console.log("✅ Foto adicionada ao álbum existente.");
      } else {
        await MediaLibrary.createAlbumAsync("MedScan", asset, false);
        console.log("✅ Álbum criado e foto salva.");
      }

      return asset.uri;
    } catch (error) {
      console.error("❌ Erro ao salvar foto na galeria:", error);
      return null;
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
  }
});
