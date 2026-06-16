import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL, HEALTH_PATH } from "../lib/api";

/**
 * Headless cold-start detector for a free-tier backend (e.g. Render) that
 * sleeps when idle and takes ~30-60s to wake on the first request.
 *
 * Pings /health with a RAW axios call (not the shared `api` instance, whose
 * timeout would abort mid-wake). Surfaces a status the UI can use to show a
 * calm "waking up" banner so visitors never think the site is broken.
 *
 * Returns: { status, elapsed, attempts, retry }
 *   status: "idle" | "checking" | "waking" | "online" | "offline"
 *   elapsed: integer seconds since the check started (tab-throttle safe)
 *   attempts: number of failed pings
 *   retry: () => void
 */
const SESSION_KEY = "coldstart:awake";

export function useColdStart({
  baseURL = API_BASE_URL,
  healthPath = HEALTH_PATH,
  graceDelay = 2500,
  pollInterval = 3000,
  pingTimeout = 65000,
  offlineDeadline = 75000,
} = {}) {
  const warmSession =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(SESSION_KEY) === "1";

  const [status, setStatus] = useState(warmSession ? "online" : "idle");
  const [elapsed, setElapsed] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const startedAt = useRef(0);
  const graceTimer = useRef(null);
  const pollTimer = useRef(null);
  const elapsedTimer = useRef(null);
  const abortRef = useRef(null);
  const mounted = useRef(true);
  const failCountRef = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;

  const url = `${baseURL}${healthPath}`;

  const clearTimers = useCallback(() => {
    if (graceTimer.current) clearTimeout(graceTimer.current);
    if (pollTimer.current) clearTimeout(pollTimer.current);
    if (elapsedTimer.current) clearInterval(elapsedTimer.current);
    graceTimer.current = pollTimer.current = elapsedTimer.current = null;
  }, []);

  const startElapsedTicker = useCallback(() => {
    if (elapsedTimer.current) return;
    elapsedTimer.current = setInterval(() => {
      if (!mounted.current) return;
      // Compute from wall-clock so backgrounded-tab throttling can't drift it.
      const ms = Date.now() - startedAt.current;
      setElapsed(Math.floor(ms / 1000));
      // Flip to "offline" on the timer itself (not only when a ping settles),
      // otherwise a long-hanging ping would delay it well past the deadline.
      if (ms >= offlineDeadline && statusRef.current === "waking") {
        setStatus("offline");
      }
    }, 1000);
  }, [offlineDeadline]);

  const declareOnline = useCallback(() => {
    clearTimers();
    if (abortRef.current) abortRef.current.abort();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    if (mounted.current) setStatus("online");
  }, [clearTimers]);

  const ping = useCallback(
    function ping() {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      axios
        .get(url, { timeout: pingTimeout, signal: ctrl.signal })
        .then((res) => {
          if (!mounted.current) return;
          if (res.status >= 200 && res.status < 300) declareOnline();
          else handleFailure();
        })
        .catch(() => {
          if (mounted.current) handleFailure();
        });

      function handleFailure() {
        if (statusRef.current === "online") return;
        // 502/503/504/network/timeout all mean "still waking" — keep polling.
        // The "offline" transition is owned by the elapsed ticker (deadline),
        // so a hung ping can't postpone it.
        failCountRef.current += 1;
        if (mounted.current) setAttempts(failCountRef.current);
        pollTimer.current = setTimeout(ping, pollInterval);
      }
    },
    [url, pingTimeout, pollInterval, declareOnline]
  );

  const begin = useCallback(() => {
    clearTimers();
    if (abortRef.current) abortRef.current.abort();
    startedAt.current = Date.now();
    failCountRef.current = 0;
    setAttempts(0);
    setElapsed(0);
    setStatus("checking");
    graceTimer.current = setTimeout(() => {
      if (mounted.current && statusRef.current === "checking") {
        setStatus("waking");
        startElapsedTicker();
      }
    }, graceDelay);
    ping();
  }, [graceDelay, ping, startElapsedTicker]);

  const retry = useCallback(() => {
    clearTimers();
    if (abortRef.current) abortRef.current.abort();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
    }
    begin(); // begin() resets attempts/elapsed/timers
  }, [begin, clearTimers]);

  useEffect(() => {
    mounted.current = true;
    if (warmSession) return undefined; // already awake this session
    begin(); // begin() clears any prior timers, so StrictMode remount is safe
    return () => {
      mounted.current = false;
      clearTimers();
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, elapsed, attempts, retry };
}
