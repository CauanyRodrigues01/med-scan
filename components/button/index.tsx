import { styles } from "@/components/button/styles";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type Props = TouchableOpacityProps & {
    title: string
}

export function Button( { title, ...rest}: Props) {
    return (
        <TouchableOpacity style={styles.container} {...rest}>
            <Text style={styles.title}>
                {title}
            </Text>
        </TouchableOpacity>
    )
}