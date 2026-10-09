import Box from "../components/Box";
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from "../theme/theme";
import Text from "../components/Text";
import React from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/types";
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, CircleChevronLeft, XIcon } from "lucide-react-native";
import { useSinglePickerStore } from "../store/singlePickerStore";
import ScrollView from "../components/ScrollView";
import Toast from "react-native-toast-message";
import { StatusBar } from "react-native";

interface Props {
    children: any
    title: string
    hasPadding?: boolean
    titleTextAlign?: 'left' | 'right'
    canGoBack?: boolean
}

const Layout = ({ canGoBack = false, titleTextAlign = 'left', hasPadding = true, children, title }: Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const isSinglePickerShown = useSinglePickerStore((state) => state.isSinglePickerShown);
    const singlePickerItems = useSinglePickerStore((state) => state.singlePickerItems);
    const singlePickerTitle = useSinglePickerStore((state) => state.singlePickerTitle);
    const hideSinglePicker = useSinglePickerStore((state) => state.hideSinglePicker);
    const setSelectedSinglePickerValue = useSinglePickerStore((state) => state.setSelectedSinglePickerValue);

    return (
        <React.Fragment>
            {/* 4.3: ic ekranlar beyaz baslikli, koyu yazili (09.10.2026). */}
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
            <SafeAreaView style={{ backgroundColor: theme.colors.white }} edges={['top']} />

            <Box zIndex={999999999}>
                <Toast topOffset={15} />
            </Box>

            {
                isSinglePickerShown && (
                    <Box flex={1} bg={theme.colors.bg}>
                        <Box height={60} bg={theme.colors.white} borderBottomWidth={1} borderColor={theme.colors.border} justifyContent="center">
                            <Box flexDirection="row" pl={15} pr={15}>
                                <Box pr={15} onPress={hideSinglePicker} justifyContent="center">
                                    <XIcon size={theme.fontSizes['3xl']} color={theme.colors.ink} />
                                </Box>

                                <Box flexGrow={1} justifyContent="center">
                                    <Text textAlign={titleTextAlign} fontWeight='bold' fontSize={theme.fontSizes.lg} color={theme.colors.ink}>{singlePickerTitle}</Text>
                                </Box>
                            </Box>
                        </Box>

                        <ScrollView p={0}>
                            {
                                singlePickerItems.map((item, index) => (
                                    <Box onPress={setSelectedSinglePickerValue ? () => { setSelectedSinglePickerValue({ label: item.value, value: item.constantId }); hideSinglePicker(); } : undefined} borderBottomWidth={1} borderColor={theme.colors.border} p={15} bg={theme.colors.white}>
                                        <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{item.value}</Text>
                                    </Box>
                                ))
                            }
                        </ScrollView>
                    </Box>
                )
            }

            {
                !isSinglePickerShown && (
                    <React.Fragment>
                        <Box height={60} bg={theme.colors.white} borderBottomWidth={1} borderColor={theme.colors.border} justifyContent="center">
                            <Box flexDirection="row" pl={15} pr={15}>
                                {
                                    (canGoBack == true) && (
                                        <Box pr={15} onPress={() => navigation.goBack()} justifyContent="center">
                                            <ChevronLeft size={theme.fontSizes['3xl']} color={theme.colors.ink} />
                                        </Box>
                                    )
                                }
                                <Box flexGrow={1} justifyContent="center">
                                    <Text textAlign={titleTextAlign} fontWeight='bold' fontSize={theme.fontSizes.lg} color={theme.colors.ink}>{title}</Text>
                                </Box>
                            </Box>
                        </Box>

                        <Box p={hasPadding ? 15 : undefined} bg={theme.colors.bg} flex={1}>
                            {children}
                        </Box>
                    </React.Fragment>
                )
            }

            <SafeAreaView style={{ backgroundColor: theme.colors.bg }} edges={['bottom']} />
        </React.Fragment>
    )
}

export default Layout;