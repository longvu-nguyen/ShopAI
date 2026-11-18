import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthResponse } from '../types';
import { authApi, cartApi, getGuestSessionId } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('shopai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shopai_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const res = await authApi.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('shopai_user', JSON.stringify(res.data));
      }
    } catch {
      // If profile fails, user might be unauthenticated
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('shopai_access_token');
      if (savedToken) {
        setToken(savedToken);
        await refreshProfile();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (authData: AuthResponse) => {
    localStorage.setItem('shopai_access_token', authData.accessToken);
    localStorage.setItem('shopai_refresh_token', authData.refreshToken);
    setToken(authData.accessToken);

    const initialUser: UserProfile = {
      id: authData.userId,
      email: authData.email,
      firstName: authData.fullName.split(' ')[0] || 'User',
      lastName: authData.fullName.split(' ').slice(1).join(' ') || '',
      roles: authData.roles,
      createdAt: new Date().toISOString(),
    };

    setUser(initialUser);
    localStorage.setItem('shopai_user', JSON.stringify(initialUser));

    // Merge guest cart if any
    try {
      const guestId = getGuestSessionId();
      await cartApi.merge(guestId);
    } catch {
      // Ignore cart merge errors
    }

    // Refresh full profile in background
    await refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem('shopai_access_token');
    localStorage.removeItem('shopai_refresh_token');
    localStorage.removeItem('shopai_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.roles?.includes('Admin') ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
