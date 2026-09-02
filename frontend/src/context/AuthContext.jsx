import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi } from '../api/auth.api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize & verify existing session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMeApi();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          logout();
        }
      } catch (err) {
        // Token invalid or expired
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for global 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const response = await loginApi(credentials);
      const { user: userData, token: jwtToken } = response.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);

      return { success: true, message: response.message, user: userData };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Login failed. Please check your credentials.',
      };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const response = await registerApi(userData);
      const { user: newUser, token: jwtToken } = response.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(jwtToken);
      setUser(newUser);

      return { success: true, message: response.message, user: newUser };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Registration failed. Please try again.',
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
