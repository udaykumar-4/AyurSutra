import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkConnectivity = async () => {
    setIsChecking(true);
    try {
      // Ping health or API endpoint
      await apiClient.get('/users/profile', { timeout: 3000 });
      setIsOnline(true);
    } catch (err: any) {
      // Network unreachable if err has code ERR_NETWORK or 503/504 or timeout
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setIsOnline(false);
      } else {
        // Server responded with an HTTP status (401, 403, 404, 500) -> Network IS online!
        setIsOnline(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 15000);
    return () => clearInterval(interval);
  }, []);

  return { isOnline, isChecking, checkConnectivity };
}

export default useNetworkStatus;
