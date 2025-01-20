import { useState } from "react"
import { StatusBar } from "expo-status-bar"
import { View, Image, ActivityIndicator } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as tensorFlow from "@tensorflow/tfjs"
import * as mobilenet from "@tensorflow-models/mobilenet"
import { decodeJpeg } from "@tensorflow/tfjs-react-native"
import * as FileSystem from "expo-file-system"

import { Button } from "@/components/button"
import { styles } from "@/styles/styleHome"
import { Classification } from "@/components/Classification"
import { classificationProps } from "@/components/Classification"

export default function Index() {
    const [uriImagemSelecionada, setUriImagemSelecionada] = useState("")
    const [isCarregando, setIsCarregando] = useState(false)
    const [resultados, setResultados] = useState<classificationProps[]>([])

    async function lidarComSelecaoDeImagem() {
        setIsCarregando(true)
        
        try {

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true
            }) 

            if (!resultado.canceled) {
                const { uri } = resultado.assets[0]
                setUriImagemSelecionada(uri)
                await classificacaoDeImagem(uri)
            }

        } catch (error) {
            console.log(error)
        } finally {
            setIsCarregando(false)
        }

    }

    async function classificacaoDeImagem(uriImagem: string) {
        setResultados([])
        await tensorFlow.ready()
        const modelo = await mobilenet.load()

        const imagemBase64 = await FileSystem.readAsStringAsync(uriImagem, {
            encoding: FileSystem.EncodingType.Base64
        })

        const bufferImagem  = tensorFlow.util.encodeString(imagemBase64, "base64").buffer
        const raw = new Uint8Array(bufferImagem)
        const tensorImagem = decodeJpeg(raw)

        const resultadoClassificacao = await modelo.classify(tensorImagem)
        setResultados(resultadoClassificacao)
    }

    return (
        <View style={styles.container}>
        <StatusBar
        translucent={true}
        style="dark"
        />

            <Image source={{ uri: uriImagemSelecionada ? uriImagemSelecionada : "https://encurtador.com.br/Yd2Jg" }} style={styles.image} />

            <View style={styles.results}>
                {
                    resultados.map((resultados) => (

                        <Classification data={resultados} key={resultados.className} />
                    ))
                }
            </View>

            {
                isCarregando 
                ? <ActivityIndicator color="#5f1bbf"/>
                : <Button title="Selecionar imagem" onPress={lidarComSelecaoDeImagem}/>
            }
        </View>
    )
}