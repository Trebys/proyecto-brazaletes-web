import { useEffect, useRef } from 'react';
import api, {
  clearStoredAuth,
  getSessionExpiredMessage,
  getStoredSessionIdleTimeoutMs,
  setSessionMessage,
} from '../api/api.js';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'];
const SESSION_REFRESH_THROTTLE_MS = 60 * 1000;
const INACTIVITY_MESSAGE =
  'Tu sesion expiro por inactividad. Inicia sesion nuevamente.';

export function AutoLogout({ children }) {
  const logoutTimerRef = useRef(null);
  const lastRefreshRef = useRef(0);

  const hasSession = () => {
    return Boolean(
      localStorage.getItem('access_token') && localStorage.getItem('user_data')
    );
  };

  const finishSession = (message) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    clearStoredAuth();
    setSessionMessage(message);
    window.location.href = '/login';
  };

  const expireSessionByInactivity = async () => {
    if (!hasSession()) {
      return;
    }

    try {
      await api.post('/logout/');
    } catch (error) {
      console.error('Error closing inactive session:', error);
    } finally {
      finishSession(INACTIVITY_MESSAGE);
    }
  };

  const verifySession = async () => {
    if (!hasSession()) {
      return;
    }

    try {
      await api.post('/refresh-token/');
      lastRefreshRef.current = Date.now();
      scheduleIdleCheck();
    } catch (error) {
      finishSession(getSessionExpiredMessage(error));
    }
  };

  const scheduleIdleCheck = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }

    if (!hasSession()) {
      return;
    }

    logoutTimerRef.current = setTimeout(
      expireSessionByInactivity,
      getStoredSessionIdleTimeoutMs()
    );
  };

  const handleActivity = () => {
    if (!hasSession()) {
      return;
    }

    scheduleIdleCheck();

    if (Date.now() - lastRefreshRef.current >= SESSION_REFRESH_THROTTLE_MS) {
      verifySession();
    }
  };

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
  }, []);

  return <>{children}</>;
}
