import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const authDataSerialized = await AsyncStorage.getItem('@CampusCare:auth');
      if (authDataSerialized) {
        const { user: _user, accessToken } = JSON.parse(authDataSerialized);
        setUser(_user);
        setToken(accessToken);
        
        // Configure axios for future requests
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Failed to load auth data', error);
    } finally {
      setLoading(false);
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: _user, accessToken } = response.data;

      setUser(_user);
      setToken(accessToken);

      api.defaults.headers.Authorization = `Bearer ${accessToken}`;

      await AsyncStorage.setItem(
        '@CampusCare:auth',
        JSON.stringify({ user: _user, accessToken })
      );
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Best effort logout on server
      await api.post('/auth/logout').catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      delete api.defaults.headers.Authorization;
      await AsyncStorage.removeItem('@CampusCare:auth');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
