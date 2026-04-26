import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PrivateRoutes = ({ requireAdmin = false }) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, refreshUser, clearAuth } = useAuth();
  const [checking, setChecking] = useState(
    Boolean(isAuthenticated && requireAdmin && !isAdmin)
  );
  const [isAuthorized, setIsAuthorized] = useState(
    requireAdmin ? isAdmin : isAuthenticated
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setChecking(false);
      setIsAuthorized(false);
      return;
    }

    if (!requireAdmin || isAdmin) {
      setChecking(false);
      setIsAuthorized(true);
      return;
    }

    let isMounted = true;

    const syncUser = async () => {
      setChecking(true);

      try {
        const currentUser = await refreshUser();

        if (!isMounted) {
          return;
        }

        setChecking(false);
        setIsAuthorized(
          Boolean(
            currentUser?.is_admin ||
              currentUser?.is_staff ||
              currentUser?.is_superuser
          )
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.response?.status === 401) {
          clearAuth();
        }

        setChecking(false);
        setIsAuthorized(false);
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, isAdmin, isAuthenticated, refreshUser, requireAdmin]);

  if (checking) {
    return <div className="p-6 text-center">Validando acceso...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
};

export default PrivateRoutes;
