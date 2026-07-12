import api from '@/lib/axios';

export type ParticipantStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Participant {
    id: number;
    name: string;
    email: string;
    eventName: string;
    certificateId: string;
    status: ParticipantStatus;
    createdAt: string;
}

export interface ParticipantFormData {
    name: string;
    email: string;
    eventName: string;
}

export async function getParticipants(status?: ParticipantStatus) {
    const response = await api.get<Participant[]>('/api/participants', {
        params: status ? { status } : undefined,
    });
    return response.data;
}

export async function addParticipant(data: ParticipantFormData) {
    const response = await api.post<Participant>('/api/participants', data);
    return response.data;
}
export async function deleteParticipant(id: number) {
    await api.delete(`/api/participants/${id}`);
}

export async function deleteParticipants(ids: number[]) {
    await api.delete('/api/participants/batch', { data: ids });
}

export interface ApiResponse {
    success: boolean;
    message: string;
}

export async function uploadParticipantsExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse>('/api/participants/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

