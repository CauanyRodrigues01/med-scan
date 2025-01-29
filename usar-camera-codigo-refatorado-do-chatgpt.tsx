// Importa as bibliotecas e componentes necessários
import {
  CameraView,
  CameraType,
  useCameraPermissions, // Gerencia permissões para acessar a câmera
} from "expo-camera";
import { router, useLocalSearchParams } from "expo-router"; 
import { useCallback, useRef, useState } from "react"; // Hooks do React
import {
  ActivityIndicator, // Indicador de carregamento
  Button,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native"; // Componentes nativos para interface
import { Ionicons } from "@expo/vector-icons"; // Ícones da biblioteca Ionicons
import * as MediaLibrary from "expo-media-library"; // Gerencia a galeria de mídia

/* COMPONENTES */

// Solicita permissão para usar a câmera
const PermissionRequest = ({ requestPermission }) => (
  <View style={{ flex: 1, justifyContent: "center" }}>
    <Text style={{ textAlign: "center", paddingBottom: 10 }}>
      We need your permission to show the camera
    </Text>
    <Button onPress={requestPermission} title="Grant Permission" />
  </View>
);

// Componente para visualizar a foto capturada
const PhotoPreview = ({ photoUri, cancelPhoto, savePhoto }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Image source={{ uri: photoUri }} style={{ width: "100%", height: "80%" }} />
    {/* Botões para cancelar ou salvar a foto */}
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 20,
      }}
    >
      <TouchableOpacity onPress={cancelPhoto}>
        <Ionicons name="close-circle" size={50} color="red" />
      </TouchableOpacity>
      <TouchableOpacity onPress={savePhoto}>
        <Ionicons name="checkmark-circle" size={50} color="green" />
      </TouchableOpacity>
    </View>
  </View>
);

// Controles para a câmera (trocar câmera, flash e tirar foto)
const CameraControls = ({
  toggleCameraFacing,
  toggleTorch,
  takePicture,
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "flex-end",
      marginBottom: 30,
    }}
  >
    <TouchableOpacity onPress={toggleCameraFacing}>
      <Ionicons name="camera-reverse" size={40} color="white" />
    </TouchableOpacity>
    <TouchableOpacity onPress={toggleTorch}>
      <Ionicons name="flashlight" size={40} color="white" />
    </TouchableOpacity>
    <TouchableOpacity onPress={takePicture}>
      <Ionicons name="camera" size={40} color="white" />
    </TouchableOpacity>
  </View>
);

/* FUNÇÕES UTILITÁRIAS */

// Função para salvar arquivos na galeria
const saveFileToGallery = async (fileUri) => {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      console.log("Permission to access gallery not granted.");
      return null;
    }

    // Cria um ativo na galeria e o adiciona ao álbum "DCIM"
    const asset = await MediaLibrary.createAssetAsync(fileUri);
    const album = await MediaLibrary.getAlbumAsync("DCIM");
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync("DCIM", asset, false);
    }

    console.log("Photo saved to gallery:", asset.uri);
    return asset.uri;
  } catch (error) {
    console.error("Error saving photo to gallery:", error);
    return null;
  }
};

/* COMPONENTE PRINCIPAL */

// Componente principal da tela de câmera
export default function CameraScreen() {
  // Estados do componente
  const [facing, setFacing] = useState<CameraType>("back"); // Define a câmera traseira como padrão
  const [torch, setTorch] = useState(false); // Controle do flash
  const [photoUri, setPhotoUri] = useState<string | null>(null); // URI da foto capturada
  const [loading, setLoading] = useState(false); // Indicador de carregamento
  const [permission, requestPermission] = useCameraPermissions(); // Gerencia permissões da câmera
  const cameraRef = useRef<CameraView>(null); // Referência para o componente CameraView

  // Função para capturar foto
  const takePicture = useCallback(async () => {
    if (cameraRef.current) {
      setLoading(true); // Ativa o indicador de carregamento
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1, // Qualidade máxima da foto
        });

        console.log("Photo captured:", photo);
        const galleryUri = await saveFileToGallery(photo.uri); // Salva a foto na galeria
        if (galleryUri) {
          setPhotoUri(galleryUri); // Atualiza o estado com a URI da foto salva
        }
      } catch (error) {
        console.error("Error taking photo:", error);
      } finally {
        setLoading(false); // Desativa o indicador de carregamento
      }
    }
  }, []);

  // Exibe uma tela em branco enquanto carrega permissões
  if (!permission) {
    return <View />;
  }

  // Exibe solicitação de permissão se não concedida
  if (!permission.granted) {
    return <PermissionRequest requestPermission={requestPermission} />;
  }

  // Alterna entre câmera frontal e traseira
  const toggleCameraFacing = () =>
    setFacing((prev) => (prev === "back" ? "front" : "back"));

  // Alterna o estado do flash (torch)
  const toggleTorch = () => setTorch((prev) => !prev);

  // Salva a foto e navega para outra tela
  const savePhoto = () => {
    if (router.canGoBack()) {
      router.back();
      router.setParams({ photoUri });
    } else {
      router.replace("/");
    }
  };

  // Cancela a visualização da foto capturada
  const cancelPhoto = () => setPhotoUri(null);

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      {/* Se uma foto foi capturada, exibe o preview */}
      {photoUri ? (
        <PhotoPreview
          photoUri={photoUri}
          cancelPhoto={cancelPhoto}
          savePhoto={savePhoto}
        />
      ) : (
        // Exibe a câmera
        <CameraView
          style={{ flex: 1 }}
          type={facing} // Define câmera frontal ou traseira
          // Esse código reclama porque está usando o nativowind para aplicar classes semelhantes ao tailwind no estilo de mapeamento de componente nativo ao nome da classe 
          flashMode={torch ? "torch" : "off"} // Controle do flash
          ref={cameraRef} // Define a referência
        >
          {/* Exibe indicador de carregamento enquanto a foto é capturada */}
          {loading && (
            <View
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="white" />
            </View>
          )}
          {/* Controles da câmera */}
          <CameraControls
            toggleCameraFacing={toggleCameraFacing}
            toggleTorch
            ={toggleTorch}
            takePicture={takePicture}
          />
        </CameraView>
      )}
    </View>
  );
}
