import api from '@/lib/axios';

export interface AuthResponse {
    token: string;
    username: string;
    email: string;
    role: string;
}

export interface ApiErrorResponse {
    success: boolean;
    message: string;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
    return response.data;
}

export async function registerUser(
    username: string,
    email: string,
    password: string
): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', {
        username,
        email,
        password,
    });
    return response.data;
}
