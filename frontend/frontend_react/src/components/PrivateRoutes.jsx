import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  clearStoredAuth,
  getClientData,
  getStoredUser,
  isAdminUser,
  persistUserData,
} from '../api/api';

const PrivateRoutes = ({ requireAdmin = false }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = getStoredUser();

    return {
      checking: Boolean(token && (!storedUser || requireAdmin)),
      isAuthenticated: Boolean(token),
      isAuthorized: requireAdmin ? isAdminUser(storedUser) : Boolean(token),
    };
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setAuthState({
        checking: false,
        isAuthenticated: false,
        isAuthorized: false,
      });
      return;
    }

    const storedUser = getStoredUser();
    if (storedUser && (!requireAdmin || isAdminUser(storedUser))) {
      setAuthState({
        checking: false,
        isAuthenticated: true,
        isAuthorized: true,
      });
      return;
    }

    let isMounted = true;

    const syncUser = async () => {
      try {
        const currentUser = await getClientData();

        if (!isMounted) {
          return;
        }

        persistUserData(currentUser);
        setAuthState({
          checking: false,
          isAuthenticated: true,
          isAuthorized: requireAdmin ? isAdminUser(currentUser) : true,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.response?.status === 401) {
          clearStoredAuth();
        }

        setAuthState({
          checking: false,
          isAuthenticated: false,
          isAuthorized: false,
        });
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [requireAdmin]);

  if (authState.checking) {
    return <div className="p-6 text-center">Validando acceso...</div>;
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!authState.isAuthorized) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
};

export default PrivateRoutes;
