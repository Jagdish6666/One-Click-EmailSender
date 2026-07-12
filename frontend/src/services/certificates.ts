import api from '@/lib/axios';

export interface ApiResponse {
    success: boolean;
    message: string;
}

export async function sendCertificates() {
    const response = await api.post<ApiResponse>('/api/certificates/send');
    return response.data;
}

export async function sendSelectedCertificates(ids: number[]) {
    const response = await api.post<ApiResponse>('/api/certificates/send-selected', ids);
    return response.data;
}
