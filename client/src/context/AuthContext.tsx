import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (api.getToken()) {
        const res = await api.get<{ user: User }>('/auth/me');
        setUser(res.user);
      } else {
        // Try refresh cookie
        const res = await api.post<{ user: User; accessToken: string }>('/auth/refresh');
        api.setToken(res.accessToken);
        setUser(res.user);
      }
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/login', { email, password });
    api.setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (fullName: string, email: string, phone: string, password: string) => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/register', {
      fullName,
      email,
      phone,
      password,
    });
    api.setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    } finally {
      api.setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

