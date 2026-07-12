import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
});

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function setAuthTokenGetter(getter: TokenGetter | null) {
    tokenGetter = getter;
}

api.interceptors.request.use(async (config) => {
    if (tokenGetter) {
        const token = await tokenGetter();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

export default api;
