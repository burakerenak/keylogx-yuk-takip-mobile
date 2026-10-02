import React, { useCallback, useState } from "react"
import Text from "../components/Text"
import { GetAmbarByIdResponse, GetAmbarByIdResponseAmbarProduct, UpdateAmbarProductRequest } from "../types/ambar.types"
import { AppStackParamList } from "../navigation/types";
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import Layout from "../layouts/Layout";
import ScrollView from "../components/ScrollView";
import Card from "../components/Card";
import Box from "../components/Box";
import { theme } from "../theme/theme";
import { formatWeight, sum, toNumber } from "../utils/numberUtils";
import { getDistanceKm, isEmpty } from "../utils/commonUtils";
import AuthTextInput from '../components/AuthTextInput';
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { getConstantList } from "../api/constant";
import SingleSelect, { CustomSingleSelectModel } from "../components/SingleSelect";
import { updateAmbarProduct } from "../api/ambar";
import { saveAsDraftIrsaliye } from "../api/uyumsoft";
import { Alert } from "react-native";

const UpdateProductScreen = () => {
    const route = useRoute<RouteProp<AppStackParamList, 'UpdateProduct'>>();

    const [ambar, setAmbar] = useState<GetAmbarByIdResponse | undefined>(undefined);
    // const [ambarProduct, setAmbarProduct] = useState<GetAmbarByIdResponseAmbarProduct | undefined>(undefined);

    const [ambarProductId, setAmbarProductId] = useState<string | undefined>(undefined);
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState<string | undefined>(undefined);
    const [selectedPotType, setSelectedPotType] = useState<CustomSingleSelectModel | undefined>(undefined);
    const [product, setProduct] = useState<string | undefined>(undefined);
    const [weight, setWeight] = useState<string | undefined>(undefined);
    const [desi, setDesi] = useState<string | undefined>(undefined);
    const [detailVolumetricWeight, setDetailVolumetricWeight] = useState<string | undefined>(undefined);
    const [width, setWidth] = useState<string | undefined>(undefined);
    const [length, setLength] = useState<string | undefined>(undefined);
    const [height, setHeight] = useState<string | undefined>(undefined);
    const [description, setDescription] = useState<string | undefined>(undefined);

    useFocusEffect(
        useCallback(() => {
            setAmbar(route.params.ambar);
            // setAmbarProduct(route.params.ambarProduct);

            setAmbarProductId(route.params.ambarProduct.ambarProductId);
            setQuantity(route.params.ambarProduct.quantity);
            setSelectedPotType(route.params.ambarProduct.potTypeId && route.params.ambarProduct.potTypeName ? { label: route.params.ambarProduct.potTypeName, value: route.params.ambarProduct.potTypeId } : undefined);
            setProduct(route.params.ambarProduct.product);
            setWeight(route.params.ambarProduct.weight);
            setDesi(route.params.ambarProduct.desi);
            setDetailVolumetricWeight(route.params.ambarProduct.detailVolumetricWeight);
            setHeight(route.params.ambarProduct.height);
            setLength(route.params.ambarProduct.length);
            setWidth(route.params.ambarProduct.width);
            setDescription(route.params.ambarProduct.description);

            return () => {
                // İstersen temizleme işlemleri
            };
        }, [])
    );

    const onUpdateAmbarProduct = async () => {
        var request: UpdateAmbarProductRequest = {
            ambarProductId: ambarProductId,
            description: description,
            desi: desi?.toString(),
            detailVolumetricWeight: detailVolumetricWeight?.toString(),
            height: height?.toString(),
            length: length?.toString(),
            potTypeId: selectedPotType?.value,
            product: product,
            quantity: quantity?.toString(),
            weight: weight?.toString(),
            width: width?.toString()
        };

        var updateAmbarProductResponse = await updateAmbarProduct(request);

        var saveAsDraftIrsaliyeResponse = await saveAsDraftIrsaliye({ ambarId: ambar?.ambarId, sendToGib: false });

        if (saveAsDraftIrsaliyeResponse.isSucceded) {
            Alert.alert("Başarılı", saveAsDraftIrsaliyeResponse.message);
        }
        else {
            Alert.alert("Hata", saveAsDraftIrsaliyeResponse.message);
        }
    }

    return (
        <Layout title={(ambar?.refNo ?? '') + ' Detayları'} canGoBack hasPadding={false}>
            <ScrollView>
                <Card>
                    <Box flexDirection="row" gap={15}>
                        <Box flex={7 / 10} justifyContent="center">
                            <SingleSelect
                                label="Kap Cinsi"
                                onMenuOpen={() => getConstantList({ code: 'POT_TYPE' })}
                                setSelectedItem={setSelectedPotType}
                                selectedItem={selectedPotType}
                            />
                        </Box>

                        <Box flex={3 / 10} justifyContent="center">
                            <TextInput
                                label={'Adet'}
                                value={quantity}
                                setValue={setQuantity}
                            />
                        </Box>
                    </Box>

                    <Box mt={15}>
                        <TextInput
                            label={'Ürün'}
                            value={product}
                            setValue={setProduct}
                        />
                    </Box>

                    <Box mt={15} flexDirection="row" gap={15}>
                        <Box flex={1} justifyContent="center">
                            <TextInput
                                label={'En (cm)'}
                                value={width}
                                setValue={(newValue: string) => {
                                    setWidth(newValue);
                                    setDesi(((toNumber(newValue ?? "0") * toNumber(length ?? "0") * toNumber(height ?? "0")) / 3000).toFixed(2))
                                }}
                            />
                        </Box>
                        <Box flex={1} justifyContent="center">
                            <TextInput
                                label={'Boy (cm)'}
                                value={length}
                                setValue={(newValue: string) => {
                                    setLength(newValue);
                                    setDesi(((toNumber(width ?? "0") * toNumber(newValue ?? "0") * toNumber(height ?? "0")) / 3000).toFixed(2));
                                }}
                            />
                        </Box>
                    </Box>

                    <Box mt={15} flexDirection="row" gap={15}>
                        <Box flex={1} justifyContent="center">
                            <TextInput
                                label={'Yükseklik (cm)'}
                                value={height}
                                setValue={(newValue: string) => {
                                    setHeight(newValue);
                                    setDesi(((toNumber(width ?? "0") * toNumber(length ?? "0") * toNumber(newValue ?? "0")) / 3000).toFixed(2))
                                }}
                            />
                        </Box>
                        <Box flex={1} justifyContent="center">
                            <TextInput
                                label={'Ağırlık'}
                                value={weight}
                                setValue={(newValue: string) => {
                                    var _detailVolumetricWeight: string | undefined = undefined;

                                    if (isEmpty(newValue))
                                        _detailVolumetricWeight = (desi ?? '');
                                    else if (isEmpty(desi))
                                        _detailVolumetricWeight = (newValue ?? '');
                                    else {
                                        var v1 = toNumber(newValue);
                                        var v2 = toNumber(desi);

                                        _detailVolumetricWeight = (v1 > v2 ? newValue : desi);
                                    }

                                    setWeight(newValue);
                                    setDetailVolumetricWeight(_detailVolumetricWeight);
                                }}
                            />
                        </Box>
                    </Box>

                    <Box mt={15} flexDirection="row" gap={15}>
                        <Box flex={1} justifyContent="center">
                            <TextInput
                                label={'Desi'}
                                value={desi}
                                disabled
                            />
                        </Box>
                        <Box flex={1} justifyContent="center">
                            <TextInput
                                label={'Detay Hac. Ağırlık'}
                                value={detailVolumetricWeight}
                                disabled
                            />
                        </Box>
                    </Box>

                    <Box mt={15}>
                        <TextInput
                            label={'Açıklama'}
                            value={description}
                            setValue={setDescription}
                        />
                    </Box>

                    <Box mt={15}>
                        <Button
                            onPress={onUpdateAmbarProduct}
                            color={theme.colors.white}
                            bg={theme.colors.blue}
                            text='Kaydet'
                        />
                    </Box>

                </Card>
            </ScrollView>
        </Layout>
    )
}

export default UpdateProductScreen;