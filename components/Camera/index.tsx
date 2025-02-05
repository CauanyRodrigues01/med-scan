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
import { styles } from './styles';

//type CameraMedProps = {
//  onPhotoCaptured: (uri: string) => void; // Declaração da prop
//};
//export default function CameraMed({ onPhotoCaptured }: CameraMedProps) {

export default function CameraMed() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [uriImagemCamera, setUriImagemCamera] = useState<string | null>(null);
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
    setUriImagemCamera(null);
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

      setUriImagemCamera(photo.uri); // Apenas armazena o URI da foto
    } catch (error) {
      console.error("❌ Erro ao tirar foto:", error);
    } finally {
      setLoading(false);
    }
  };

  // Salva a foto na galeria quando o usuário confirma
  const savePhoto = async () => {
    if (!uriImagemCamera) {
      console.log("⚠️ Nenhuma foto disponível para salvar.");
      return;
    }

    setLoading(true);
    try {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        console.warn("⚠️ Permissão para acessar a galeria não concedida. Foto não salva.");
        await deleteTemporaryPhoto(uriImagemCamera);
        return;
      }

      const galleryUri = await saveFileToGallery(uriImagemCamera);
      if (galleryUri) {
        console.log("✅ Foto confirmada e salva na galeria:", galleryUri);
        setUriImagemCamera(null);
        //onPhotoCaptured(uriImagemCamera); // Atualiza o estado em home.tsx
        console.log("URI sendo passada pelo promp");
        exitCamera();
        console.log("Saindo da camera");
      } else {
        console.warn("⚠️ A foto não foi salva na galeria.");
        await deleteTemporaryPhoto(uriImagemCamera);
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

  // Alterna entre câmera frontal e traseira
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Cancela a foto e volta para a câmera
  const cancelPhoto = () => {
    setUriImagemCamera(null);
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
        {uriImagemCamera ? (
          <PhotoPreview
            photoUri={uriImagemCamera}
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