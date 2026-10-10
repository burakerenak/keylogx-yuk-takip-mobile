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
    /** Yukleme tarihi: 10.10.2026 itibariyla "Yukleme Yapildi" aninda dolar. */
    loadDate: any
    /** Yukleme tarihi (dd.MM.yyyy HH:mm). */
    loadDateStr?: string
    /** Yukleme noktasina varis zamani ("Yukleme Noktasina Varildi", 10.10.2026). */
    loadArrivalDate?: string | null
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
    /** Firma yetkilisi (tek aktif yetkili ya da en son kaydedilen) ve telefonu; yalniz GetAmbarById doldurur (09.10.2026). */
    loadingFirmAuthorizedPersonName?: string | null
    loadingFirmAuthorizedPersonPhone?: string | null
    deliverFirmAuthorizedPersonName?: string | null
    deliverFirmAuthorizedPersonPhone?: string | null
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
    /** Arac tanimindaki "Arac Cinsi" (4.3.1; 4.3 yanlislikla Arac Cinsi 2 gosteriyordu). */
    vehicleTypeName?: string
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
    /** 4.3: yuklemede yuku teslim eden kisi (siparisin Teslim Eden alani). */
    shippingDeliverer?: string
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

export interface AmbarAddFileArchiveRequest {
    ambarId: string
    fileTypeId: string
    b64: string
    description?: string
}

export interface AmbarAddFileArchiveResponse {
    fileArchiveId: string
    fileTypeId: string | undefined
    fileTypeName: string | undefined
    fileName: string
    url: string
}

export interface AmbarDeleteFileArchiveRequest {
    ambarId: string
    fileArchiveId: string
}

export interface AmbarFileArchiveListItem {
    fileArchiveId: string
    fileTypeId: string | undefined
    fileTypeName: string | undefined
    /** Evrak turunun kodu; kutular koda gore eslesir, ada gore degil. */
    fileTypeKey: string | undefined
    fileName: string
    url: string
    description: string | undefined
}

export interface AmbarSetDeliveryEndDateRequest {
    ambarId: string
    b64?: string
    fileTypeId?: string
    lat: number | undefined
    lon: number | undefined
    /** 4.3: teslim alan kisi (siparisin Teslim Alan alani). */
    shippingReceiver?: string
}

export interface AmbarSetDeliveryEndDateResponse {

}