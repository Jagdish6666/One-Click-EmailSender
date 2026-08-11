import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
});

// Automatically attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401 responses globally — redirect to sign-in
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('jwt_user');
            // Only redirect if not already on auth pages
            if (!window.location.pathname.startsWith('/sign-')) {
                window.location.href = '/sign-in';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
