// Importa módulos e bibliotecas necessárias
import { useState, useEffect, useRef } from "react"; // Hook para gerenciar estados no React
import { CameraView, CameraType, useCameraPermissions, } from "expo-camera";
import { StatusBar } from "expo-status-bar"; // Gerencia a barra de status no aplicativo
import { View, ActivityIndicator, Image, Alert, Modal, } from "react-native"; // Componentes básicos do React Native
import * as ImagePicker from "expo-image-picker"; // Biblioteca para selecionar imagens da galeria ou capturar fotos
import * as FileSystem from "expo-file-system"; // Biblioteca para manipulação de arquivos no Expo

import * as tensorFlow from "@tensorflow/tfjs"; // Biblioteca TensorFlow.js para manipulação de modelos de machine learning
import * as mobilenet from "@tensorflow-models/mobilenet"; // Modelo MobileNet para classificação de imagens
import { decodeJpeg } from "@tensorflow/tfjs-react-native"; // Função para decodificar imagens no formato JPEG em tensores

// Importa componentes e estilos personalizados
import { Button } from "@/components/button"; // Botão personalizado
import { styles } from "@/styles/styleHome"; // Estilos específicos para a página
import { Classification } from "@/components/Classification"; // Componente que exibe resultados de classificação
import { classificationProps } from "@/components/Classification"; // Tipagem para resultados de classificação
import * as MediaLibrary from "expo-media-library"; // Gerencia a galeria de mídia
import React from "react";
import { CameraControls } from "@/components/CameraControls";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PhotoPreview } from "@/components/PhotoPreview";

// Componente principal da tela
export default function Index() {
    // Estados para controlar o comportamento da aplicação
    const [uriImagemSelecionada, setUriImagemSelecionada] = useState(""); // URI da imagem selecionada
    const [isCarregando, setIsCarregando] = useState(false); // Flag para exibir indicador de carregamento
    const [resultados, setResultados] = useState<classificationProps[]>([]); // Resultados da classificação

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
    async function deleteTemporaryPhoto(uri) {
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

    async function checkPermissions() {
        const { status } = await MediaLibrary.getPermissionsAsync();
        console.log("📌 Permissão atual:", status);
        return status === "granted";
    };

    // Captura a foto sem salvar automaticamente na galeria
    async function takePicture() {
        if (!cameraRef.current) return;

        setLoading(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
            console.log("📸 Foto capturada:", photo.uri);

            setUriImagemCamera(photo.uri); // Apenas armazena o URI da foto
            setUriImagemSelecionada(photo.uri);
            classificacaoDeImagem(photo.uri); // Classifica a imagem selecionada
        } catch (error) {
            console.error("❌ Erro ao tirar foto:", error);
        } finally {
            setLoading(false);
        }
    };

    // Salva a foto na galeria quando o usuário confirma
    async function savePhoto() {
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
    async function saveFileToGallery(uri) {
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
    async function cancelPhoto() {
        setUriImagemCamera(null);
    };

    // Função para lidar com a seleção de uma imagem
    async function lidarComSelecaoDeImagem() {
        setIsCarregando(true); // Ativa o indicador de carregamento

        try {
            // Abre a galeria para selecionar uma imagem
            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // Permite apenas seleção de imagens
                allowsEditing: true, // Permite edição básica da imagem
                aspect: [4, 4], // Imagens com proporção quadrada
                quality: 1, // Qualidade da imagem selecionada (0 a 1)
            });

            // Verifica se o usuário não cancelou a seleção
            if (!resultado.canceled) {
                const { uri } = resultado.assets[0]; // Obtém o URI da imagem selecionada
                setUriImagemSelecionada(uri); // Salva o URI no estado
                await classificacaoDeImagem(uri); // Classifica a imagem selecionada
            }

        } catch (error) {
            console.log(error); // Exibe erros no console
        } finally {
            setIsCarregando(false); // Desativa o indicador de carregamento
        }
    }

    // Função para classificar a imagem
    async function classificacaoDeImagem(uriImagem: string) {
        setResultados([]); // Limpa resultados anteriores
        await tensorFlow.ready(); // Garante que o TensorFlow está pronto para uso
        const modelo = await mobilenet.load(); // Carrega o modelo MobileNet

        // Lê a imagem como uma string base64
        const imagemBase64 = await FileSystem.readAsStringAsync(uriImagem, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Converte a string base64 em um buffer de bytes
        const bufferImagem = tensorFlow.util.encodeString(imagemBase64, "base64").buffer;
        const raw = new Uint8Array(bufferImagem); // Cria um array de bytes não processados
        const tensorImagem = decodeJpeg(raw); // Decodifica a imagem em um tensor

        // Redimensiona a imagem para 224x224 pixels
        const tensorRedimensionado = tensorFlow.image.resizeBilinear(tensorImagem, [224, 224], true);

        // Normaliza os valores dos pixels para o intervalo [0, 1]
        const tensorNormalizado = tensorRedimensionado.div(255.0);

        // Remove a dimensão do batch, garantindo que é um Tensor3D
        const tensorFinal = tensorNormalizado.squeeze(); // Remove dimensões de tamanho 1

        // Classifica a imagem usando o modelo carregado
        const resultadoClassificacao = await modelo.classify(tensorFinal as tensorFlow.Tensor3D);
        setResultados(resultadoClassificacao); // Salva os resultados no estado
        console.log(resultadoClassificacao);
    }

    // Renderização do componente
    return (
        <View style={styles.container}>
            {/* Configuração da barra de status */}
            <StatusBar translucent={true} style="dark" />
            {/* Exibe a imagem selecionada ou uma imagem padrão */}
            <Image
                source={{ uri: uriImagemSelecionada ? uriImagemSelecionada : "https://encurtador.com.br/Yd2Jg" }}
                style={styles.image}
            />

            {/* Exibe os resultados de classificação */}
            <View style={styles.results}>
                {resultados.map((resultado) => (
                    <Classification data={resultado} key={resultado.className} />
                ))}
            </View>

            {/* Exibe o indicador de carregamento ou o botão para selecionar imagem */}
            {isCarregando ? (
                <ActivityIndicator color="#5f1bbf" />
            ) : (
                <>
                    <Button title="Selecionar imagem" onPress={lidarComSelecaoDeImagem} />
                    <Button title="Tirar Foto" onPress={handleOpenCamera} />
                </>
            )}

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
