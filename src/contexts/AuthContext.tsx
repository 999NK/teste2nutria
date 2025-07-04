import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiRequest} from '../services/api';

interface User {
  id: number;
  email: string;
  name?: string;
  weight?: number;
  height?: number;
  age?: number;
  goal?: string;
  activity_level?: string;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const userData = await apiRequest('/api/user');
        if (userData && !userData.error) {
          setUser(userData);
        } else {
          await AsyncStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      });

      if (response.success && response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify({email, password, name}),
      });

      if (response.success && response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/api/logout', {method: 'POST'});
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      if (response.success) {
        setUser(prev => prev ? {...prev, ...userData} : null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('User update failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};