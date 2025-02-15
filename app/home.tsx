import React, { useState, useRef, useEffect } from "react";
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
import { translate } from "@vitalets/google-translate-api";

export default function Index() {
  const [imageUri, setImageUri] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<classificationProps[]>([]);
  const [translatedClassification, setTranslatedClassification] = useState<classificationProps[]>([]);
  const [facing, setFacing] = useState<CameraType>("back");
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  async function handleOpenCamera() {
    try {
      const { granted } = await requestCameraPermission();
      if (!granted) throw new Error("Permissão da câmera negada");
      setModalVisible(true);
    } catch (error) {
      console.error("Erro ao abrir câmera:", error);
      Alert.alert("Erro", "Não foi possível acessar a câmera.");
    }
  }

  function closeCamera() {
    setModalVisible(false);
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      console.log("Foto capturada:", photo.uri);
      setImageUri(photo.uri);
      setModalVisible(false);
      await classifyImage(photo.uri);
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Falha ao capturar a foto.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCameraFacing() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  async function handleImageSelection() {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });
      if (result.canceled) return;
      const { uri } = result.assets[0];
      console.log("Imagem selecionada:", uri);
      setImageUri(uri);
      await classifyImage(uri);
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Não foi possível selecionar a imagem.");
    } finally {
      setLoading(false);
    }
  }

  async function classifyImage(uri: string) {
    try {
      setResults([]);
      setTranslatedClassification([]);  
      await tensorFlow.ready();
      const model = await mobilenet.load();
      console.log("Modelo MobileNet carregado");
      const imageBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const buffer = tensorFlow.util.encodeString(imageBase64, "base64").buffer;
      const raw = new Uint8Array(buffer);
      const tensorImage = decodeJpeg(raw);
      const resizedTensor = tensorFlow.image.resizeBilinear(tensorImage, [224, 224], true);
      const tensorNormalized = resizedTensor.div(255.0);
      const result = await model.classify(tensorNormalized as tensorFlow.Tensor3D);
      console.log("Resultado da classificação:", result);
      setResults(result);  // Atualiza o estado com os resultados classificados
    } catch (error) {
      console.error("Erro ao classificar imagem:", error);
      Alert.alert("Erro", "Falha na classificação da imagem.");
    }
  }

  // Sempre que`results` for atualizado, traduzimos automaticamente
  useEffect(() => {
    async function translateClassificationResults() {
      try {
        if (results.length > 0) {
          console.log("Iniciando tradução...");
          const translatedResults = await Promise.all(
            results.map(async (result) => {
              const translation = await translate(result.className, { to: "pt" });
              return {
                className: translation.text,
                probability: result.probability,
              };
            })
          );
          setTranslatedClassification(translatedResults);
          console.log("Resultados traduzidos:", translatedResults);
        }
      } catch (error) {
        console.error("Erro ao traduzir os resultados:", error);
      }
    }
    translateClassificationResults();
  }, [results]);  // Dependência `results`, será executado sempre que `results` mudar

  return (
    <View style={styles.container}>
      <StatusBar translucent style="dark" />
      <Image source={{ uri: imageUri || "https://encurtador.com.br/Yd2Jg" }} style={styles.image} />
      <View style={styles.results}>
        {translatedClassification.map((res) => (
          <Classification data={res} key={res.className} />
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color="#5f1bbf" />
      ) : (
        <View style={{ width: "80%", flex: 1 }}>
          <Button title="Selecionar Imagem" onPress={handleImageSelection} />
          <Button title="Tirar Foto" onPress={handleOpenCamera} />
        </View>
      )}
      <Modal visible={modalVisible} style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mirror={facing === "front"}>
          <CameraControls toggleCameraFacing={toggleCameraFacing} exitCamera={closeCamera} takePicture={takePicture} />
        </CameraView>
      </Modal>
    </View>
  );
}
