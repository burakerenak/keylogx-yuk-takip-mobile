export type GetAmbarListRequest = {
    driverId: string
}

export type GetAmbarListResponse = GetAmbarListResponseData[]

export interface GetAmbarListResponseData {
    ambarId: string
    companyId: string
    refNo: string
    customerId: string
    carryTypeId: string
    orderStatusId: any
    carryMethodId: string
    waitTime: number
    warehouseReceipt: string
    customerDeliveryNoteNumber: any
    isBridge: boolean
    expressVehicleId: string
    divisionId: string
    poId: any
    poNo: any
    note: any
    ambarVoyageId: string
    customerName: string
    carryTypeName: string
    carryTypeKey: string
    orderStatusName: any
    carryMethodName: string
    expressVehicleName: string
    divisionName: string
    poName: any
    ambarVoyage: GetAmbarListResponseAmbarVoyage
    orderDate: string
    loadDate: any
    deliveryDate: any
    senderCustomerId: string
    senderCustomerAddressTypeId: string
    senderCustomerAddressText: any
    senderCustomerName: string
    senderCustomerAddressTypeName: string
    receiverCustomerId: string
    receiverCustomerAddressTypeId: string
    receiverCustomerAddressText: any
    receiverCustomerName: string
    receiverCustomerAddressTypeName: string
    loadingFirmCustomerId: string
    loadingFirmCustomerAddressTypeId: string
    loadingFirmCustomerAddressText: any
    loadingFirmCustomerName: string
    loadingFirmCustomerAddressTypeName: string
    deliverFirmCustomerId: string
    deliverFirmCustomerAddressTypeId: string
    deliverFirmCustomerAddressText: any
    deliverFirmCustomerName: string
    deliverFirmCustomerAddressTypeName: string
    loadingCountyId: string
    loadingDistrictId: string
    loadingNeighborhoodId: string
    deliverCountyId: string
    deliverDistrictId: string
    deliverNeighborhoodId: any
    loadingCountyName: string
    loadingDistrictName: string
    loadingNeighborhoodName: string
    deliverCountyName: string
    deliverDistrictName: string
    deliverNeighborhoodName: any
    loadingRegionId: string
    loadingRegionName: string
    deliverRegionId: string
    deliverRegionName: string
    shippingStatusId: any
    shippingCreateDate: any
    shippingCreateDateStr: any
    shippingLoadDate: any
    shippingLoadDateStr: any
    shippingDeliverDate: any
    shippingDeliverDateStr: any
    shippingDeliverer: any
    shippingReceiver: any
    shippingStatusName: any
    ambarProducts: GetAmbarListResponseAmbarProduct[]
    ambarExpectedIncomeOutcomes: any[]
    fileArchives: any[]
    totalQuantity: number
    totalWeight: number
    totalDesi: number
    totalHeight: number
    totalLength: number
    totalWidth: number
    totalDetailVolumetricWeight: number
    saleInvoiceStatus: string
    purchaseInvoiceStatus: string
    saleInvoiceTotalAmount: number
    purchaseInvoiceTotalAmount: number
    saleInvoiceNumbers: any
    purchaseInvoiceNumbers: any
    transferDate: any
    transferDateStr: any
    deliverFirmCustomerAddressLat?: number
    deliverFirmCustomerAddressLon?: number
    loadingFirmCustomerAddressLat?: number
    loadingFirmCustomerAddressLon?: number
    createdDate: string
    createdUser: string
    updatedDate: string
    updatedUser: string
}

export interface GetAmbarListResponseAmbarVoyage {
    ambarVoyageId: string
    companyId: string
    refNo: string
    vehicleId: string
    trailerId: any
    driverId: string
    supplierId: string
    vehicleName: string
    trailerName: any
    driverName: string
    supplierName: string
    isCustomActive: boolean
    createdDate: string
    createdDateStr: string
}

export interface GetAmbarListResponseAmbarProduct {
    ambarProductId: string
    ambarId: string
    quantity: number
    potTypeId: string
    product: string
    weight: number
    desi: number
    height: any
    length: any
    width: any
    detailVolumetricWeight: number
    potTypeName: string
}

export type GetAmbarByIdRequest = {
    id: string
}

export type GetAmbarByIdResponse = {
    ambarId: string
    companyId: string
    refNo: string
    customerId: any
    carryTypeId: string
    orderStatusId: string
    carryMethodId: any
    waitTime: any
    warehouseReceipt: any
    customerDeliveryNoteNumber: any
    isBridge: boolean
    expressVehicleId: any
    divisionId: any
    poId: any
    poNo: any
    note: any
    ambarVoyageId: string
    customerName: any
    carryTypeName: string
    carryTypeKey: string
    orderStatusName: string
    carryMethodName: any
    expressVehicleName: any
    divisionName: any
    poName: any
    ambarVoyage?: GetAmbarByIdResponseAmbarVoyage
    orderDate: string
    loadDate: any
    deliveryDate: any
    senderCustomerId: any
    senderCustomerAddressTypeId: any
    senderCustomerAddressText: any
    senderCustomerName: any
    senderCustomerAddressTypeName: any
    receiverCustomerId: any
    receiverCustomerAddressTypeId: any
    receiverCustomerAddressText: any
    receiverCustomerName: any
    receiverCustomerAddressTypeName: any
    loadingFirmCustomerId: string
    loadingFirmCustomerAddressTypeId: string
    loadingFirmCustomerAddressText: string
    loadingFirmCustomerName: string
    loadingFirmCustomerAddressTypeName: string
    deliverFirmCustomerId: string
    deliverFirmCustomerAddressTypeId: string
    deliverFirmCustomerAddressText: string
    deliverFirmCustomerName: string
    deliverFirmCustomerAddressTypeName: string
    loadingCountyId: string
    loadingDistrictId: string
    loadingNeighborhoodId: any
    deliverCountyId: string
    deliverDistrictId: string
    deliverNeighborhoodId: any
    loadingCountyName: string
    loadingDistrictName: string
    loadingNeighborhoodName: any
    deliverCountyName: string
    deliverDistrictName: string
    deliverNeighborhoodName: any
    loadingRegionId: any
    loadingRegionName: any
    deliverRegionId: any
    deliverRegionName: any
    shippingStatusId: any
    shippingCreateDate: any
    shippingCreateDateStr: any
    shippingLoadDate: any
    shippingLoadDateStr: any
    shippingDeliverDate: any
    shippingDeliverDateStr: any
    shippingDeliverer: any
    shippingReceiver: any
    shippingStatusName: any
    ambarProducts: GetAmbarByIdResponseAmbarProduct[]
    ambarExpectedIncomeOutcomes: any[]
    fileArchives: any[]
    totalQuantity: number
    totalWeight: number
    totalDesi: number
    totalHeight: number
    totalLength: number
    totalWidth: number
    totalDetailVolumetricWeight: number
    saleInvoiceStatus: string
    purchaseInvoiceStatus: string
    saleInvoiceTotalAmount: number
    purchaseInvoiceTotalAmount: number
    saleInvoiceNumbers: string
    purchaseInvoiceNumbers: string
    transferDate: any
    transferDateStr: any
    deliverFirmCustomerAddressLat: number
    deliverFirmCustomerAddressLon: number
    loadingFirmCustomerAddressLat: number
    loadingFirmCustomerAddressLon: number
    createdDate: string
    createdUser: string
    updatedDate: string
    updatedUser: string
}

export interface GetAmbarByIdResponseAmbarVoyage {
    ambarVoyageId: string
    companyId: string
    refNo: string
    vehicleId: string
    trailerId: string
    driverId: string
    supplierId: string
    vehicleName: string
    trailerName: string
    driverName: string
    supplierName: string
    isCustomActive: boolean
    createdDate: string
    createdDateStr: string
    deviceData?: GetAmbarByIdResponseAmbarVoyageDeviceData
    vehicleType2Name?: string
    startDate?: string
    endDate?: string
}

export interface GetAmbarByIdResponseAmbarVoyageDeviceData {
    latitude: number
    longitude: number
}

export interface GetAmbarByIdResponseAmbarProduct {
    ambarProductId: string
    ambarId: string
    quantity: string
    potTypeId?: string
    product: any
    weight: string
    desi: any
    height: any
    length: any
    width: any
    detailVolumetricWeight?: string
    potTypeName?: string
    description?: string
}

export interface UpdateAmbarProductRequest {
    ambarProductId?: string
    quantity?: string
    potTypeId?: string
    product?: string
    weight?: string
    desi?: string
    height?: string
    width?: string
    detailVolumetricWeight?: string
    length?: string
    description?: string
}

export interface UpdateAmbarProductResponse {

}

export interface AmbarSetLoadDateRequest {
    ambarId: string
    lat: number | undefined
    lon: number | undefined
}

export interface AmbarSetLoadDateResponse {

}

export interface AmbarSetLoadEndDateRequest {
    ambarId: string
    lat: number | undefined
    lon: number | undefined
}

export interface AmbarSetLoadEndDateResponse {

}

export interface AmbarSetDeliveryDateRequest {
    ambarId: string
    lat: number | undefined
    lon: number | undefined
}

export interface AmbarSetDeliveryDateResponse {

}

export interface AmbarSetDeliveryEndDateRequest {
    ambarId: string
    b64: string
    fileTypeId: string
    lat: number | undefined
    lon: number | undefined
}

export interface AmbarSetDeliveryEndDateResponse {

}