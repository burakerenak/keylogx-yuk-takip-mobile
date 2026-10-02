import { TouchableOpacity } from "react-native";
import Text from "./Text";
import { theme } from "../theme/theme";
import Box from "./Box";
import React from "react";

interface Props {
    text?: string
    bg: string
    color: string
    onPress?: () => void
    pl?: number
    pr?: number
    icon?: any
    fontSize?: number
    pt?: number
    pb?: number
}

const Button = ({ icon, text, bg, color, onPress, pl, pr, fontSize, pt, pb }: Props) => {
    return (
        <TouchableOpacity onPress={onPress} style={{ backgroundColor: bg, borderRadius: 10, paddingLeft: pl, paddingRight: pr }}>
            <Box pt={pt ?? 10} pb={pb ?? 10}>
                {
                    !icon && (
                        <Text fontWeight="bold" textAlign="center" fontSize={fontSize ?? theme.fontSizes["xl"]} color={color}>{text}</Text>
                    )
                }

                {
                    icon && (
                        <React.Fragment>
                            {icon}
                        </React.Fragment>
                    )
                }
            </Box>
        </TouchableOpacity>
    )
}

export default Button;