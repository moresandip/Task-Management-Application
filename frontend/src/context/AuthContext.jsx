import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

// ── Context Definition ────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ── Provider Component ────────────────────────────────────────────────────────

/**
 * AuthProvider wraps the application and exposes authentication state
 * and actions to every component via the useAuth() hook.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while we check localStorage on mount

  // On first mount, restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupted data — clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  /**
   * Stores the token and user in state and localStorage.
   * Called after a successful login or register API response.
   */
  const saveSession = useCallback((responseData) => {
    const { token: newToken, user: newUser } = responseData;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * Registers a new user and immediately logs them in.
   */
  const register = useCallback(async (name, email, password) => {
    const { data } = await authApi.register({ name, email, password });
    saveSession(data);
    return data;
  }, [saveSession]);

  /**
   * Logs in an existing user.
   */
  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    saveSession(data);
    return data;
  }, [saveSession]);

  /**
   * Clears all auth state and redirects to login.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // Use location.href for a full page reset
    window.location.href = '/login';
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Custom Hook ───────────────────────────────────────────────────────────────

/**
 * useAuth — consume the AuthContext from any component.
 * Throws an error if used outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
