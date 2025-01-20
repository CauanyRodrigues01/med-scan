import { StyleSheet } from "react-native";

export const styleIndex = StyleSheet.create({ 
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "space-evenly", 
        alignItems: "center",
        backgroundColor: "#E8E8E8",
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    titulo: {
        fontSize: 32,
    },
    textoIntroduction: {
        textAlign: "center",
        fontSize: 18,
    },
    item: {
        padding: 10,
        backgroundColor: "#E4E4E4",
        borderRadius: 8,
        marginVertical: 10,
        fontSize: 14,
    },
    buttonContent: {
        height: 56,
        width: "100%",
        backgroundColor: "#577AE4",
        borderRadius: 7,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
});
