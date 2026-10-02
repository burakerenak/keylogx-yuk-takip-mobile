export type ApiResponse<T> = {
    isSuccess: boolean;
    data: T;
    message?: string;
};