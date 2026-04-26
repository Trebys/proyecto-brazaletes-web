import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, {
  getSessionExpiredMessage,
  getStoredSessionIdleTimeoutMs,
  setSessionMessage,
} from '../api/api.js';
import { useAuth } from '../auth/AuthContext.jsx';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'];
const SESSION_REFRESH_THROTTLE_MS = 60 * 1000;
const INACTIVITY_MESSAGE =
  'Tu sesion expiro por inactividad. Inicia sesion nuevamente.';

export function AutoLogout({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, clearAuth } = useAuth();
  const logoutTimerRef = useRef(null);
  const lastRefreshRef = useRef(0);

  const finishSession = useCallback((message) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    clearAuth();
    setSessionMessage(message);
    navigate('/login', { replace: true });
  }, [clearAuth, navigate]);

  const expireSessionByInactivity = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await api.post('/logout/');
    } catch (error) {
      console.error('Error closing inactive session:', error);
    } finally {
      finishSession(INACTIVITY_MESSAGE);
    }
  }, [finishSession, isAuthenticated]);

  const scheduleIdleCheck = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    if (!isAuthenticated) {
      return;
    }

    logoutTimerRef.current = setTimeout(
      expireSessionByInactivity,
      getStoredSessionIdleTimeoutMs()
    );
  }, [expireSessionByInactivity, isAuthenticated]);

  const verifySession = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await api.post('/refresh-token/');
      lastRefreshRef.current = Date.now();
      scheduleIdleCheck();
    } catch (error) {
      finishSession(getSessionExpiredMessage(error));
    }
  }, [finishSession, isAuthenticated, scheduleIdleCheck]);

  const handleActivity = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    scheduleIdleCheck();

    if (Date.now() - lastRefreshRef.current >= SESSION_REFRESH_THROTTLE_MS) {
      verifySession();
    }
  }, [isAuthenticated, scheduleIdleCheck, verifySession]);

  useEffect(() => {
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    const handleStorage = (event) => {
      if (event.key === 'access_token' && !event.newValue) {
        finishSession('Tu sesion fue cerrada en otra pestana.');
      }

      if (event.key === 'access_token' && event.newValue) {
        scheduleIdleCheck();
      }
    };

    window.addEventListener('storage', handleStorage);
    scheduleIdleCheck();

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }

      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorage);
    };
  }, [finishSession, handleActivity, scheduleIdleCheck]);

  return <>{children}</>;
}
