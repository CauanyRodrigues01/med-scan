// Importa os componentes necessários do pacote 'expo-camera' e outras dependências do React Native
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Define o componente principal
export default function CameraMed() {
  // Estado que controla o tipo de câmera (frontal ou traseira)
  const [facing, setFacing] = useState<CameraType>('back');

  const [modalIsVisible, setModalIsVisible] = useState(false);

  // Hook para gerenciar permissões da câmera
  const [permission, requestPermission] = useCameraPermissions();

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

  // Função que alterna entre a câmera frontal e a traseira
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Renderiza a interface do usuário
  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={handleOpenCamera} style={styles.iconButton}>
        <Ionicons name="camera-outline" size={32} color="green" />
      </TouchableOpacity>

      <Modal visible={modalIsVisible} style={{ flex: 1 }}>
        {/* Exibe a visualização da câmera */}
        <CameraView facing={facing} style={{ flex: 1 }}>
          <View style={styles.buttonContainer}>
            {/* Botão para alternar entre câmera frontal e traseira */}
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Ionicons name="repeat-outline" size={32} color="green" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setModalIsVisible(false)} >
              <Ionicons name="close-outline" size={32} color="green" />
            </TouchableOpacity>
          </View>
        </CameraView>
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
