"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '../utils/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = () => {
            const storedToken = Cookies.get('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, userData: User) => {
        Cookies.set('token', newToken, { expires: 1 });
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = () => {
        Cookies.remove('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
