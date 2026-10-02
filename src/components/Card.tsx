import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { theme } from "../theme/theme";
import Box from "./Box";

interface Props {
    children: any
    mt?: number
    p?: number
    onPress?: () => void
    swipeable?: () => React.JSX.Element
}

const Card = ({ swipeable, mt, children, p, onPress }: Props) => {
    return (

        <Box overflow="hidden" onPress={onPress} mt={mt} borderRadius={16} boxShadow='0 2px 6px rgba(16,24,40,.04)' borderColor={theme.colors.border} borderWidth={1} p={p ?? 15} bg={theme.colors.white}>
            <Swipeable renderRightActions={swipeable}>
                <Box bg={theme.colors.white}>
                    {children}
                </Box>
            </Swipeable>
        </Box>
    )
}

export default Card;