import api from '@/lib/axios';

export interface ApiResponse {
    success: boolean;
    message: string;
}

export async function uploadTemplate(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse>('/api/templates/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export async function getActiveTemplate() {
    const response = await api.get<ApiResponse>('/api/templates/active');
    return response.data;
}
