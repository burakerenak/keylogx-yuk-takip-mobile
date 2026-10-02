export type GetConstantListRequest = {
    code: string
}

export type GetConstantListResponse = GetConstantListResponseData[]

export interface GetConstantListResponseData {
    constantId: string
    name: any
    value: string
    additionalValue1: string
    additionalValue2: any
    additionalValue3: any
    companyId: any
    isCustomActive: boolean
    parentConstantId: any
    createdDate: string
    createdUser: string
    updatedDate: string
    updatedUser: string
}