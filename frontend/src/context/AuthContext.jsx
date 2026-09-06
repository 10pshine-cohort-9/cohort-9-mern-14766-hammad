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

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const saveSession = useCallback((userData, jwtToken) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  }, []);

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
          clearSession();
        }
      } catch (err) {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [clearSession]);

  // Listen for global 401 unauthorized events from Axios interceptor
  useEffect(() => {
    window.addEventListener('auth:unauthorized', clearSession);
    return () => window.removeEventListener('auth:unauthorized', clearSession);
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      try {
        const response = await loginApi(credentials);
        const { user: userData, token: jwtToken } = response.data;
        saveSession(userData, jwtToken);
        return { success: true, message: response.message, user: userData };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Login failed. Please check your credentials.',
        };
      }
    },
    [saveSession]
  );

  const register = useCallback(
    async (userData) => {
      try {
        const response = await registerApi(userData);
        const { user: newUser, token: jwtToken } = response.data;
        saveSession(newUser, jwtToken);
        return { success: true, message: response.message, user: newUser };
      } catch (err) {
        return {
          success: false,
          message: err.message || 'Registration failed. Please try again.',
        };
      }
    },
    [saveSession]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout: clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

