import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Re-verify token on mount or token change
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.data?.user || res.user);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to verify existing session:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      const { user: userData, token: authToken } = res.data;

      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData, message: res.message };
    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      const { user: newUser, token: authToken } = res.data;

      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true, user: newUser, message: res.message };
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
