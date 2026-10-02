import { Text as Text2 } from 'react-native';

interface Props {
    children: any
    fontSize?: number
    textAlign?: 'center' | 'right' | 'left'
    color?: string
    fontWeight?: 'bold' | '600' | 'thin' | '700'
    lineHeight?: number
}

const Text = ({ lineHeight, children, fontSize, textAlign, color, fontWeight }: Props) => {
    return (
        <Text2 style={{ lineHeight: lineHeight, fontSize, textAlign, color, fontWeight }}>{children}</Text2>
    )
}

export default Text;