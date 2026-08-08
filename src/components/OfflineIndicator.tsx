import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { useOfflineStatus } from '../offline/useOfflineStatus';
import { syncNow, onSyncOutcome } from '../offline/syncEngine';
import { cn } from '../utils/cn';

/**
 * Persistent connection status for the cashier.
 *
 * The point is to make "offline" feel routine rather than alarming: sales keep
 * working, and the badge simply says how many are waiting to reach the server.
 * Anything the server refused is escalated separately, because that is the only
 * case a human actually has to act on.
 */
export function OfflineIndicator() {
  const { online, pending, failed } = useOfflineStatus();
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(0);

  useEffect(() => {
    return onSyncOutcome((outcome) => {
      if (outcome.applied > 0) {
        setJustSynced(outcome.applied);
        const t = setTimeout(() => setJustSynced(0), 4000);
        return () => clearTimeout(t);
      }
    });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncNow();
    } finally {
      setSyncing(false);
    }
  };

  // Fully online, nothing queued, nothing broken: stay out of the way.
  if (online && pending === 0 && failed === 0 && justSynced === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-4">
      <div
        className={cn(
          'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ring-1',
          !online && 'bg-amber-50 text-amber-900 ring-amber-200',
          online && failed > 0 && 'bg-red-50 text-red-900 ring-red-200',
          online && failed === 0 && pending > 0 && 'bg-blue-50 text-blue-900 ring-blue-200',
          online && failed === 0 && pending === 0 && 'bg-green-50 text-green-900 ring-green-200',
        )}
      >
        {!online && (
          <>
            <CloudOff className="h-4 w-4 shrink-0" />
            <span>
              Offline &mdash; sales are being saved on this device
              {pending > 0 && ` (${pending} waiting)`}
            </span>
          </>
        )}

        {online && failed > 0 && (
          <>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {failed} sale{failed === 1 ? '' : 's'} could not be saved &mdash; needs review
            </span>
          </>
        )}

        {online && failed === 0 && pending > 0 && (
          <>
            <RefreshCw className={cn('h-4 w-4 shrink-0', syncing && 'animate-spin')} />
            <span>
              Syncing {pending} sale{pending === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Sync now
            </button>
          </>
        )}

        {online && failed === 0 && pending === 0 && justSynced > 0 && (
          <>
            <Check className="h-4 w-4 shrink-0" />
            <span>
              {justSynced} offline sale{justSynced === 1 ? '' : 's'} synced
            </span>
          </>
        )}
      </div>
    </div>
  );
}
