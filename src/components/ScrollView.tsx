import { ScrollView as ScrollView2 } from 'react-native';

interface Props {
    children: any
    p?: number
}

const ScrollView = ({ children, p }: Props) => {
    return (
        <ScrollView2 style={{ flex: 1 }} contentContainerStyle={{ padding: p ?? 15 }}>
            {children}
        </ScrollView2>
    )
}

export default ScrollView;