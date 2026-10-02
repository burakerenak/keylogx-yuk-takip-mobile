import { TouchableOpacity, View } from 'react-native';

interface Props {
    children?: any
    flex?: number
    bg?: string
    justifyContent?: 'center'
    mt?: number
    p?: number
    pt?: number
    pb?: number
    alignSelf?: 'center'
    aspectRatio?: number
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    boxShadow?: string
    flexDirection?: 'row'
    width?: number
    height?: number
    ml?: number
    mr?: number
    position?: 'absolute'
    flexGrow?: number
    mb?: number
    zIndex?: number,
    onPress?: () => void
    borderTopWidth?: number
    borderBottomWidth?: number
    pl?: number
    pr?: number
    m?: number
    alignItems?: 'center'
    gap?: number
    px?: number
    overflow?: 'hidden'
}

const Box = ({ overflow, px, gap, alignItems, m, pr, pl, borderBottomWidth, borderTopWidth, onPress, zIndex, mb, flexGrow, position, mr, ml, height, width, flexDirection, boxShadow, borderColor, borderWidth, borderRadius, aspectRatio, alignSelf, children, flex, bg, justifyContent, mt, p, pt, pb }: Props) => {
    return (
        <TouchableOpacity
            disabled={!onPress}
            onPress={onPress}
            style={{
                overflow,
                paddingHorizontal: px,
                gap,
                alignItems,
                margin: m,
                paddingRight: pr,
                paddingLeft: pl,
                borderBottomWidth,
                borderTopWidth,
                borderRadius,
                aspectRatio,
                alignSelf,
                flex,
                backgroundColor: bg,
                justifyContent: justifyContent,
                marginTop: mt,
                padding: p,
                paddingTop: pt,
                paddingBottom: pb,
                borderWidth,
                borderColor,
                boxShadow,
                flexDirection,
                width,
                height,
                marginLeft: ml,
                marginRight: mr,
                position,
                flexGrow,
                marginBottom: mb,
                zIndex
            }}>
            {children}
        </TouchableOpacity>
    )
}

export default Box;