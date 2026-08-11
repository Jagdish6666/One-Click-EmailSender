'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    username: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'jwt_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Restore session from localStorage on mount
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem(TOKEN_KEY);
            const savedUser = localStorage.getItem(USER_KEY);
            if (savedToken && savedUser) {
                // Basic check: is the token not expired? (decode payload)
                const payload = JSON.parse(atob(savedToken.split('.')[1]));
                const isExpired = payload.exp * 1000 < Date.now();
                if (!isExpired) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                } else {
                    // Token expired — clear storage
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                }
            }
        } catch (e) {
            // Corrupted storage — clear
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback((newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        router.push('/sign-in');
    }, [router]);

    const getToken = useCallback(() => {
        return token;
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                logout,
                getToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
