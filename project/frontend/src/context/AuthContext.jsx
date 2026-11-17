import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminAPI } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const [token, setToken] = useState(() => localStorage.getItem('oxybott_admin_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check existing session
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await AdminAPI.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          localStorage.removeItem('oxybott_admin_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        localStorage.removeItem('oxybott_admin_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  const login = useCallback(async (username, password) => {
    try {
      const res = await AdminAPI.login(username, password);
      if (res.success && res.token) {
        localStorage.setItem('oxybott_admin_token', res.token);
        setToken(res.token);
        setUser(res.user);
        showToast(`Welcome back, ${res.user.username}!`);
        return { success: true };
      }
      return { success: false, error: res.error || 'Authentication failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed. Please check credentials.' };
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    try {
      await AdminAPI.logout();
    } catch (e) {}
    localStorage.removeItem('oxybott_admin_token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.');
  }, [showToast]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const res = await AdminAPI.changePassword(currentPassword, newPassword);
      if (res.success) {
        showToast('Password updated successfully.');
        return { success: true };
      }
      return { success: false, error: res.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

