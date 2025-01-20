
import { View, Text, Pressable, Image } from "react-native"
import { Link } from 'expo-router';

import { styleIndex } from "@/styles/styleIndex";
import { StatusBar } from "expo-status-bar";

export default function Index() {
    return (
        <View style={styleIndex.container}>
            <StatusBar
                translucent={true}
                style="dark"
            />

            <Image source={require("../assets/images/logo.png")} style={styleIndex.image} />

            <Text style={styleIndex.titulo}>MedScan</Text>

            <Text style={styleIndex.textoIntroduction}>Identifique equipamentos médicos de forma fácil e rápida com o MedScan!</Text>

            <View>
                <Text style={styleIndex.item}>1. Tire uma foto ou carregue uma imagem</Text>
                <Text style={styleIndex.item}>2. Obtenha informações sobre o equipamento</Text>
                <Text style={styleIndex.item}>3. Armazene o histórico</Text>
            </View>

            <Link href="/home" asChild>
                <Pressable style={styleIndex.buttonContent}>
                    <Text style={styleIndex.buttonText}> COMEÇAR </Text>
                </Pressable>
            </Link>

        </View>
    )
}