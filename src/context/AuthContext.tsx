import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ServiceCategory } from '../types/index.ts';
import { api, authStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  pendingService: ServiceCategory | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  login: (data: { email?: string; phone?: string; password?: string }) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    locality?: string;
    password?: string;
  }) => Promise<User>;
  logout: () => void;
  switchUser: (user: User) => void;
  openAuthModal: (mode?: 'login' | 'register', forService?: ServiceCategory | null) => void;
  closeAuthModal: () => void;
  setPendingService: (service: ServiceCategory | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingService, setPendingService] = useState<ServiceCategory | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function verifyUser() {
      const storedToken = authStorage.getToken();
      if (storedToken) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
          authStorage.setUser(res.user);
        } catch (err) {
          console.warn('Session verification failed, logging out', err);
          authStorage.clear();
          setUser(null);
          setToken(null);
        }
      } else {
        // If no user is logged in, default to Priya Sharma (customer) for an immediately usable demo experience
        const defaultUser: User = {
          id: 'usr-customer-1',
          email: 'customer@atozservice.com',
          name: 'Priya Sharma',
          phone: '+91 98765 43210',
          role: 'customer',
          address: 'Flat 402, Lotus Residency, 4th Cross Road',
          locality: 'Central City & Downtown',
          createdAt: new Date().toISOString(),
        };
        const demoToken = btoa(`${defaultUser.id}:${defaultUser.role}:${Date.now()}`);
        authStorage.setToken(demoToken);
        authStorage.setUser(defaultUser);
        setUser(defaultUser);
        setToken(demoToken);
      }
      setIsLoading(false);
    }

    verifyUser();
  }, []);

  const login = async (data: { email?: string; phone?: string; password?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(data);
      setUser(res.user);
      setToken(res.token);
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      setIsAuthModalOpen(false);
      return res.user;
    } catch (err: any) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    locality?: string;
    password?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.register(data);
      setUser(res.user);
      setToken(res.token);
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      setIsAuthModalOpen(false);
      return res.user;
    } catch (err: any) {
      const message = err.message || 'Registration failed. Please check your details.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
    setToken(null);
    setPendingService(null);
  };

  const switchUser = (newUser: User) => {
    const dummyToken = btoa(`${newUser.id}:${newUser.role}:${Date.now()}`);
    authStorage.setToken(dummyToken);
    authStorage.setUser(newUser);
    setUser(newUser);
    setToken(dummyToken);
    setIsAuthModalOpen(false);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login', forService: ServiceCategory | null = null) => {
    setAuthModalMode(mode);
    if (forService) {
      setPendingService(forService);
    }
    setError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        pendingService,
        isAuthModalOpen,
        authModalMode,
        login,
        register,
        logout,
        switchUser,
        openAuthModal,
        closeAuthModal,
        setPendingService,
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
