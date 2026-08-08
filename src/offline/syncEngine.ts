import { drain, type SyncOutcome } from './outbox';

/**
 * Decides *when* to drain the outbox.
 *
 * Three triggers, because none alone is reliable on a cheap Android till:
 *  - the browser's `online` event, which fires on reconnect but also lies
 *    (it only reports link state, not whether the server is actually reachable)
 *  - returning to the foreground, since a backgrounded tab is throttled
 *  - a slow poll, which is the backstop for when the two above are missed
 */

const POLL_INTERVAL_MS = 30_000;

type OutcomeListener = (outcome: SyncOutcome) => void;
const outcomeListeners = new Set<OutcomeListener>();

export function onSyncOutcome(fn: OutcomeListener): () => void {
  outcomeListeners.add(fn);
  return () => outcomeListeners.delete(fn);
}

async function attempt() {
  const outcome = await drain();
  if (outcome && (outcome.applied > 0 || outcome.rejected > 0)) {
    outcomeListeners.forEach((fn) => fn(outcome));
  }
}

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

export function startSyncEngine(): () => void {
  if (started) return () => undefined;
  started = true;

  const onOnline = () => void attempt();
  const onVisible = () => {
    if (document.visibilityState === 'visible') void attempt();
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  timer = setInterval(() => void attempt(), POLL_INTERVAL_MS);

  // Drain anything left over from a previous session on startup.
  void attempt();

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    if (timer) clearInterval(timer);
    started = false;
  };
}

/** Manual "sync now" for the cashier who does not want to wait for the poll. */
export async function syncNow(): Promise<SyncOutcome | null> {
  const outcome = await drain();
  if (outcome) outcomeListeners.forEach((fn) => fn(outcome));
  return outcome;
}
