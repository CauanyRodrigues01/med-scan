// Importa os componentes necessários do pacote 'expo-camera' e outras dependências do React Native
import {
  CameraView,
  CameraType,
  useCameraPermissions
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
export default function CameraMed() {
  // Estados do componente
  const [facing, setFacing] = useState<CameraType>("back"); // Define a câmera traseira como padrão
  const [torch, setTorch] = useState(false); // Controle do flash
  const [photoUri, setPhotoUri] = useState<string | null>(null); // URI da foto capturada
  const [loading, setLoading] = useState(false); // Indicador de carregamento
  const [permission, requestPermission] = useCameraPermissions(); // Gerencia permissões da câmera
  const cameraRef = useRef<CameraView>(null); // Referência para o componente CameraView
  const [modalIsVisible, setModalIsVisible] = useState(false);

  // Mostra a câmera
  async function handleOpenCamera() {
    try {
      // pede permissão para abrir a câmera
      const { granted } = await requestPermission();

      // Se a permissão não for concedida
      if (!granted) {
        return Alert.alert("Camera", "Você precisa habilitar o uso da câmera");
      }
      setModalIsVisible(true);

    } catch (error) {
      console.log(error);
    }

  }

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


  // Função que alterna entre a câmera frontal e a traseira
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Salva a foto e navega para outra tela
  const savePhoto = () => {
    if (router.canGoBack()) {
      router.back();
      router.setParams({ photoUri });
    } else {
      router.replace("/");
    }
  };

  // Alterna o estado do flash (torch)
  const toggleTorch = () => setTorch((prev) => !prev);


  // Cancela a visualização da foto capturada
  const cancelPhoto = () => setPhotoUri(null);

  // Renderiza a interface do usuário
  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={handleOpenCamera} style={styles.iconButton}>
        <Ionicons name="camera-outline" size={32} color="green" />
      </TouchableOpacity>

      <Modal visible={modalIsVisible} style={{ flex: 1 }}>
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
            facing={facing}
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
            <View style={styles.buttonContainer}>
              {/* Botão para alternar entre câmera frontal e traseira */}
              <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                <Ionicons name="repeat-outline" size={32} color="green" />
              </TouchableOpacity>
              {/* Botão para sair da câmera */}
              <TouchableOpacity style={styles.button} onPress={() => setModalIsVisible(false)} >
                <Ionicons name="close-outline" size={32} color="green" />
              </TouchableOpacity>
              {/* Botão para alternar flash */}
              <TouchableOpacity style={styles.button} onPress={toggleTorch} >
                <Ionicons name="flashlight" size={32} color="green" />
              </TouchableOpacity>
              {/* Botão para capturar a foto */}
              <TouchableOpacity style={styles.button} onPress={takePicture} >
                <Ionicons name="camera" size={32} color="green" />
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </Modal>
    </View>
  );
}

// Estilização do componente
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa toda a altura da tela
    justifyContent: 'center', // Centraliza os elementos verticalmente
    alignItems: 'center', // Centraliza os elementos horizontalmente
  },
  message: {
    textAlign: 'center', // Centraliza o texto horizontalmente
    paddingBottom: 10, // Adiciona um espaçamento abaixo do texto
  },
  camera: {
    flex: 1, // Ocupa todo o espaço disponível
  },
  buttonContainer: {
    flex: 1, // Ocupa o espaço dentro da câmera
    flexDirection: 'row', // Organiza os botões em linha
    backgroundColor: 'transparent', // Fundo transparente para não cobrir a câmera
    margin: 64, // Adiciona margens ao redor do botão
  },
  button: {
    flex: 1, // Ocupa o espaço disponível dentro do container
    alignSelf: 'flex-end', // Posiciona o botão no final da tela
    alignItems: 'center', // Centraliza o texto do botão horizontalmente
  },
  text: {
    fontSize: 24, // Tamanho da fonte do texto do botão
    fontWeight: 'bold', // Deixa o texto em negrito
    color: 'white', // Cor branca para o texto do botão
  },
  iconButton: {
    padding: 10, // Adiciona uma área clicável ao redor do ícone
    borderRadius: 50, // Deixa o botão arredondado
    backgroundColor: "rgba(0, 255, 0, 0.1)", // Fundo transparente com destaque
    alignItems: 'center',
    width: '20%'
  },
});
