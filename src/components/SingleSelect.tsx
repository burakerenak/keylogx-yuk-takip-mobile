import { ChevronDown, X, XIcon } from "lucide-react-native";
import { theme } from "../theme/theme";
import Box from "./Box";
import Text from "./Text";
import { GetConstantListResponse } from "../types/constant.types";
import { useSinglePickerStore } from "../store/singlePickerStore";

export interface CustomSingleSelectModel {
    label: string
    value: string
}

interface Props {
    label?: string
    selectedItem?: CustomSingleSelectModel
    disabled?: boolean
    onMenuOpen: () => Promise<GetConstantListResponse>
    setSelectedItem: React.Dispatch<React.SetStateAction<CustomSingleSelectModel | undefined>> | ((value: CustomSingleSelectModel | undefined) => void)
}

const SingleSelect = ({ label, selectedItem, disabled, onMenuOpen, setSelectedItem }: Props) => {
    const showSinglePicker = useSinglePickerStore((s) => s.showSinglePicker);

    const openMenu = async () => {
        var items = await onMenuOpen();
        showSinglePicker(items, setSelectedItem, label);
    }

    return (
        <Box>
            {
                label && (
                    <Box mb={8}>
                        <Text color={theme.colors.ink} fontWeight="600" fontSize={theme.fontSizes.md}>{label}</Text>
                    </Box>
                )
            }

            <Box justifyContent="center" bg={!disabled ? theme.colors.white : theme.colors.bg} height={48} borderWidth={1} borderColor={theme.colors.border} borderRadius={10}>
                <Box flex={1} flexDirection="row">
                    <Box pl={12} onPress={openMenu} flexGrow={1} justifyContent="center">
                        <Text fontSize={16} color={selectedItem ? theme.colors.ink : theme.colors.placeholder}>{selectedItem ? selectedItem.label : 'Seçiniz'}</Text>
                    </Box>

                    <Box onPress={selectedItem ? () => setSelectedItem(undefined) : undefined} pl={12} pr={12} justifyContent="center">
                        {
                            !selectedItem && (
                                <ChevronDown size={24} color={theme.colors.placeholder} />
                            )
                        }

                        {
                            selectedItem && (
                                <XIcon size={24} color={theme.colors.ink} />
                            )
                        }
                    </Box>
                </Box>
            </Box>

            {/* <TextInput2
                onChangeText={setValue}
                value={value?.toString() ?? ''}
                style={{
                    fontSize: 16,
                    color: theme.colors.ink,
                    backgroundColor:
                }}
                placeholderTextColor='rgba(255,255,255,.25)'
                editable={!disabled}
            /> */}
        </Box>
    )
}

export default SingleSelect;