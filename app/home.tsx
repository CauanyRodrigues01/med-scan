import React, { useState, useRef } from "react";
import { View, Image, ActivityIndicator, Alert, Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as tensorFlow from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import { Button } from "@/components/button";
import { styles } from "@/styles/styleHome";
import { Classification } from "@/components/Classification";
import { CameraControls } from "@/components/CameraControls";
import { classificationProps } from "@/components/Classification";

export default function Index() {
  const [imageUri, setImageUri] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<classificationProps[]>([]);
  const [facing, setFacing] = useState<CameraType>("back");
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Abre a câmera solicitando permissão
  async function handleOpenCamera() {
    const { granted } = await requestCameraPermission();
    if (!granted) return Alert.alert("Câmera", "Permissão necessária.");
    setModalVisible(true);
  }

  // Fecha a câmera
  function closeCamera() {
    setModalVisible(false);
    setImageUri("");
  }

  // Captura a foto 
  async function takePicture() {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      setImageUri(photo.uri);
      setModalVisible(false);
      await classifyImage(photo.uri);
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
    } finally {
      setLoading(false);
    }
  }

  // Alterna entre câmera frontal e traseira
  function toggleCameraFacing() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  // Função para lidar com a seleção de uma imagem direto da galeria
  async function handleImageSelection() {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });
      if (!result.canceled) {
        const { uri } = result.assets[0];
        setImageUri(uri);
        await classifyImage(uri);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Função para classificar a imagem
  async function classifyImage(uri: string) {
    setResults([]); // Limpa resultados anteriores
    await tensorFlow.ready(); // Garante que o TensorFlow está pronto para uso
    const model = await mobilenet.load(); // Carrega o modelo MobileNet
    // Lê a imagem como uma string base64
    const imageBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Converte a string base64 em um buffer de bytes
    const buffer = tensorFlow.util.encodeString(imageBase64, "base64").buffer;
    const raw = new Uint8Array(buffer); // Cria um array de bytes não processados
    const tensorImage = decodeJpeg(raw); // Decodifica a imagem em um tensor
    const resizedTensor = tensorFlow.image.resizeBilinear(tensorImage, [224, 224], true); // Redimensiona a imagem para 224x224 pixels
    const tensorNormalized = resizedTensor.div(255.0); // Normaliza os valores dos pixels para o intervalo [0, 1]
    const result = await model.classify(tensorNormalized as tensorFlow.Tensor3D);
    setResults(result);
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent style="dark" />
      {/* Exibe a imagem selecionada ou uma imagem padrão */}
      <Image source={{ uri: imageUri || "https://encurtador.com.br/Yd2Jg" }} style={styles.image} />
      {/* Exibe os resultados de classificação */}
      <View style={styles.results}>
        {results.map((res) => (
          <Classification data={res} key={res.className} />
        ))}
      </View>
      {/* Exibe o indicador de carregamento ou o botão para selecionar imagem */}
      {loading ? (
        <ActivityIndicator color="#5f1bbf" />
      ) : (
        <>
          <Button title="Selecionar Imagem" onPress={handleImageSelection} />
          <Button title="Tirar Foto" onPress={handleOpenCamera} />
        </>
      )}
      <Modal visible={modalVisible} style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mirror={facing === "front"}>
          <CameraControls toggleCameraFacing={toggleCameraFacing} exitCamera={closeCamera} takePicture={takePicture} />
        </CameraView>
      </Modal>
    </View>
  );
}
