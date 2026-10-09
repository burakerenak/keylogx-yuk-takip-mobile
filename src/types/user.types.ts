export type LoginRequest = {
    username: string;
    password: string;
    application: string;
};

export type LoginResponse = {
    id: string
    email: string
    nameSurname: string
    token: string
    expireInMinutes: number
    isAdmin: boolean
    authorizedMenus: LoginResponseAuthorizedMenu[]
    roles: string[]
    driverId: any
    driverName: any
    companyId: string
}

export interface LoginResponseAuthorizedMenu {
    menuName: string
    canInsert: boolean
    canDelete: boolean
    canUpdate: boolean
    canExcel: boolean
    canDocument: boolean
}

export type UpdateFirebaseTokenRequest = {
    token: string
};

export type UpdateFirebaseTokenResponse = {
}
export interface GetMyProfileResponse {
    nameSurname?: string | null
    username?: string | null
    email?: string | null
    phone?: string | null
    companyName?: string | null
    driverName?: string | null
    driverPhone?: string | null
}
