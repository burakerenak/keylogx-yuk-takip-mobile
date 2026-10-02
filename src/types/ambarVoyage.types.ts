export type GetAmbarVoyageListRequest = {
    driverId: string
}

export type GetAmbarVoyageListResponse = GetAmbarVoyageListResponseData[]

export interface GetAmbarVoyageListResponseData {
    ambarVoyageId: string
    companyId: string
    refNo: string
    vehicleId: string
    trailerId: string
    driverId: string
    supplierId: string
    isCustomActive: boolean
    vehicleName: string
    trailerName: string
    driverName: string
    supplierName: string
    ambars: GetAmbarVoyageListResponseAmbar[]
    vehicleTypeId?: string
    vehicleTypeName?: string
    vehicleType2Id?: string
    vehicleType2Name?: string
    createdDate: string
    createdUser: string
    updatedDate: string
    updatedUser: string
    startDate?: string
    startDateStr?: string
    endDate?: string
    endDateStr?: string
}

export interface GetAmbarVoyageListResponseAmbar {
    ambarId: string
    refNo: string
    customerId?: string
    customerName?: string
    deliverFirmCustomerId?: string
    deliverFirmCustomerName?: string
    deliverFirmCustomerAddressText?: string
    deliverFirmCustomerAddressLat?: number
    deliverFirmCustomerAddressLon?: number
    deliverCountyId?: string
    deliverCountyName?: string
    deliverDistrictId?: string
    deliverDistrictName?: string
    ambarVoyageOrder: number
    loadingFirmCustomerId?: string
    loadingFirmCustomerName?: string
    loadingFirmCustomerAddressText?: string
    loadingFirmCustomerAddressLat?: number
    loadingFirmCustomerAddressLon?: number
    loadingCountyId?: string
    loadingCountyName?: string
    loadingDistrictId?: string
    loadingDistrictName?: string
    ambarProducts: GetAmbarVoyageListResponseAmbarProduct[]
    orderStatusName?: string
    createdDateStr?: string
}

export interface GetAmbarVoyageListResponseAmbarProduct {
    weight: number
}

export type GetAmbarVoyageByIdRequest = {
    id: string
}

export interface GetAmbarVoyageByIdResponse {
    ambarVoyageId: string
    companyId: string
    refNo: string
    vehicleId: string
    trailerId: string
    driverId: string
    supplierId: string
    isCustomActive: boolean
    vehicleName: string
    trailerName: string
    driverName: string
    supplierName: string
    ambars: GetAmbarVoyageByIdResponseAmbar[]
    vehicleTypeId: string
    vehicleTypeName: string
    vehicleType2Id: any
    vehicleType2Name: any
    startDate?: string
    endDate?: string
    deviceData?: GetAmbarVoyageByIdResponseDeviceData
    createdDate: string
    createdUser: string
    updatedDate: string
    updatedUser: string
}

export interface GetAmbarVoyageByIdResponseAmbar {
    ambarId: string
    refNo: string
    customerId?: string
    customerName?: string
    deliverFirmCustomerId: string
    deliverFirmCustomerName: string
    deliverFirmCustomerAddressText: string
    deliverFirmCustomerAddressLat: number
    deliverFirmCustomerAddressLon: number
    deliverCountyId: string
    deliverCountyName: string
    deliverDistrictId: string
    deliverDistrictName: string
    ambarVoyageOrder: number
    loadingFirmCustomerId: string
    loadingFirmCustomerName: string
    loadingFirmCustomerAddressText: string
    loadingFirmCustomerAddressLat: number
    loadingFirmCustomerAddressLon: number
    loadingCountyId: string
    loadingCountyName: string
    loadingDistrictId: string
    loadingDistrictName: string
    ambarProducts: GetAmbarVoyageByIdResponseAmbarProduct[]
    createdDateStr: string
    orderStatusId: string
    orderStatusName: string
    isSendGib?: boolean
    loadDate?: string
    loadEndDate?: string
    deliveryDate?: string
    deliveryEndDate?: string
}

export interface GetAmbarVoyageByIdResponseAmbarProduct {
    weight: number
}

export interface GetAmbarVoyageByIdResponseDeviceData {
    latitude: number
    longitude: number
}

export interface StartAmbarVoyageRequest {
    id: string
}

export interface StartAmbarVoyageResponse {

}

export interface EndAmbarVoyageRequest {
    id: string
}

export interface EndAmbarVoyageResponse {

}