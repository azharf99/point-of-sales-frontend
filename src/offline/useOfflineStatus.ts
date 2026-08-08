import { useEffect, useState } from 'react';
import { pendingCount, failedCount, subscribeOutbox } from './outbox';

export interface OfflineStatus {
  online: boolean;
  /** Sales captured locally that the server has not yet acknowledged. */
  pending: number;
  /** Sales the server refused; these need someone to look at them. */
  failed: number;
}

/**
 * Single source of truth for the connection banner and the pending badge.
 *
 * `navigator.onLine` is only a link-state signal -- a till connected to a wifi
 * router with no upstream still reports online -- so the pending count matters
 * more than the flag: it reflects what the server has actually confirmed.
 */
export function useOfflineStatus(): OfflineStatus {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      setPending(await pendingCount());
      setFailed(await failedCount());
    };

    void refresh();

    const unsubscribe = subscribeOutbox(() => void refresh());
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { online, pending, failed };
}
