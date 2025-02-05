// Importa módulos e bibliotecas necessárias
import { useState, useEffect, useRef } from "react"; // Hook para gerenciar estados no React
import { CameraView } from "expo-camera";
import { StatusBar } from "expo-status-bar"; // Gerencia a barra de status no aplicativo
import { View, ActivityIndicator, Image } from "react-native"; // Componentes básicos do React Native
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
import CameraMed from "@/components/Camera";

// Componente principal da tela
export default function Index() {
    // Estados para controlar o comportamento da aplicação
    const [uriImagemGaleria, setUriImagemGaleria] = useState(null);
    const [uriImagemCamera, setUriImagemCamera] = useState(null);
    const [isCarregando, setIsCarregando] = useState(false); // Flag para exibir indicador de carregamento
    const [resultados, setResultados] = useState<classificationProps[]>([]); // Resultados da classificação

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
                setUriImagemGaleria(uri); // Salva o URI no estado
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
                source={{ uri: uriImagemCamera || uriImagemGaleria || "https://encurtador.com.br/Yd2Jg" }} 
                style={styles.image}
            />

            {/* Exibe os resultados de classificação */}
            <View style={styles.results}>
                {resultados.map((resultado) => (
                    <Classification data={resultado} key={resultado.className} />
                ))}
            </View>

            {/* Exibe o indicador de carregamento ou o botão para selecionar imagem */}
            {isCarregando
                ? <ActivityIndicator color="#5f1bbf" /> // Indicador de carregamento
                : <Button title="Selecionar imagem" onPress={lidarComSelecaoDeImagem} /> // Botão de seleção
            }
            <CameraMed onPhotoCaptured={setUriImagemCamera} />
        </View>
    );
}
