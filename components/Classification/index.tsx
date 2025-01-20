import { View, Text } from "react-native";
import { styles } from "./styles";

export type classificationProps = {
    probability: number
    className: string
}

type Props = {
    data: classificationProps;
}

export function Classification( { data }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.probability}>
                {data.probability.toFixed(4)}
            </Text>
            <Text style={styles.className}>
                {data.className}
            </Text>
        </View>
    )
}