import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client.js';
import type { LoginInput } from '@helpdesk/shared';

export interface User {
  id: number;
  nome: string;
  email: string;
  role: 'SOLICITANTE' | 'TECNICO' | 'GESTOR' | 'DIRETOR' | 'ADMIN';
  unidadeId: number;
  unidadeNome?: string;
  sectorId?: number;
  sectorNome?: string;
  passwordResetRequired: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<{ user: User }>('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginInput) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/api/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
