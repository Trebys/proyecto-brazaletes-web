import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  clearStoredAuth,
  getClientData,
  getStoredToken,
  getStoredUser,
  isAdminUser,
  Logout,
  persistAuthSession,
  persistUserData,
} from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());

  const syncFromStorage = useCallback(() => {
    setToken(getStoredToken());
    setUser(getStoredUser());
  }, []);

  const storeAuthSession = useCallback(({ token: nextToken, user: nextUser, session }) => {
    persistAuthSession({ token: nextToken, user: nextUser, session });
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const updateUser = useCallback((nextUser) => {
    persistUserData(nextUser);
    setUser(nextUser);
  }, []);

  const clearAuth = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    await Logout();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await getClientData();
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (['access_token', 'user_data'].includes(event.key)) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncFromStorage]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isAdmin: isAdminUser(user),
      storeAuthSession,
      updateUser,
      clearAuth,
      logout,
      refreshUser,
    }),
    [clearAuth, logout, refreshUser, storeAuthSession, token, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
