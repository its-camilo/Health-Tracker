import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  has_gemini_key: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL resolution strategy (orden de prioridad):
// 1. process.env.EXPO_PUBLIC_BACKEND_URL (inyectada por Expo en tiempo de build)
// 2. Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL (app.json / app.config.*)

// 3. Fallback constante definido aquí (Codespaces actual)
const DEFAULT_BACKEND_URL = 'https://fantastic-train-rxwxqr7g55xcww9v-8000.app.github.dev';
const RESOLVED_BACKEND_URL = (
  (typeof process !== 'undefined' && (process as any)?.env?.EXPO_PUBLIC_BACKEND_URL) ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  DEFAULT_BACKEND_URL
);

function ensureBaseUrl(): string {
  if (!RESOLVED_BACKEND_URL) {
    // Último recurso: se retorna fallback y se avisa por consola en lugar de lanzar.
    console.warn('[Auth] Backend URL no encontrada, usando fallback DEFAULT_BACKEND_URL');
    return DEFAULT_BACKEND_URL;
  }
  return RESOLVED_BACKEND_URL.replace(/\/$/, '');
}

async function safeParseJSON(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!contentType.includes('application/json')) {
    // Intentar detectar HTML dev server / error proxy
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(
        'El servidor devolvió HTML en lugar de JSON. Revisa la URL del backend o CORS.'
      );
    }
    // Intento final: tratar de parsear aunque no haya content-type adecuado
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Respuesta no es JSON válido.');
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('No se pudo parsear JSON (posible HTML o error de servidor).');
  }
}

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    
    // Limpiar estado del contexto
    setToken(null);
    setUser(null);
    
    console.log('Logout successful - user logged out');
  }, []);

  const verifyToken = useCallback(async (authToken: string) => {
    try {
      const base = ensureBaseUrl();
      const response = await fetch(`${base}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Token invalid');
      }
      const userData = await safeParseJSON(response);
      setUser(userData);
    } catch (error) {
      console.error('Token verification failed:', error);
      await logout();
    }
  }, [logout]);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        await verifyToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  }, [verifyToken, logout]);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  // (verifyToken ya definido arriba con useCallback)

  const login = async (email: string, password: string) => {
    try {
      const base = ensureBaseUrl();
      // El backend actual espera username/password en /auth/login
      const response = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      let data: any;
      try {
        data = await safeParseJSON(response);
      } catch (parseErr: any) {
        throw new Error(parseErr.message || 'Error parseando respuesta');
      }

      if (!response.ok) {
        // Mejorar el manejo de errores para evitar [object Object]
        let errorMessage = 'Error al iniciar sesión';
        if (data?.detail) {
          errorMessage = typeof data.detail === 'string' ? data.detail : 'Credenciales inválidas';
        } else if (data?.message) {
          errorMessage = typeof data.message === 'string' ? data.message : 'Error del servidor';
        }
        throw new Error(errorMessage);
      }

      // El backend no devuelve user, así que lo sintetizamos
      const synthesizedUser: User = {
        id: data.user?.id || email,
        email,
        name: data.user?.name || email.split('@')[0],
        has_gemini_key: data.user?.has_gemini_key ?? false,
      };

      await AsyncStorage.setItem('auth_token', data.access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(synthesizedUser));

      setToken(data.access_token);
      setUser(synthesizedUser);
    } catch (error: any) {
      console.error('Error en login:', error);
      // Mejor manejo de errores para evitar [object Object]
      let errorMessage = 'Error de conexión';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const base = ensureBaseUrl();
      // Backend /auth/register espera: username, email, password
      const response = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: name.trim() || email.split('@')[0], email, password }),
      });

      let data: any;
      try {
        data = await safeParseJSON(response);
      } catch (parseErr: any) {
        throw new Error(parseErr.message || 'Error parseando respuesta');
      }

      if (!response.ok) {
        // Mejorar el manejo de errores para evitar [object Object]
        let errorMessage = 'Error al registrarse';
        if (data?.detail) {
          errorMessage = typeof data.detail === 'string' ? data.detail : 'Error de validación';
        } else if (data?.message) {
          errorMessage = typeof data.message === 'string' ? data.message : 'Error del servidor';
        }
        throw new Error(errorMessage);
      }

      const synthesizedUser: User = {
        id: data.user?.id || email,
        email,
        name: name || email.split('@')[0],
        has_gemini_key: false,
      };

      await AsyncStorage.setItem('auth_token', data.access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(synthesizedUser));

      setToken(data.access_token);
      setUser(synthesizedUser);
    } catch (error: any) {
      console.error('Error en registro:', error);
      // Mejor manejo de errores para evitar [object Object]
      let errorMessage = 'Error de conexión';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      throw new Error(errorMessage);
    }
  };

  // (logout ya definido arriba con useCallback)

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}