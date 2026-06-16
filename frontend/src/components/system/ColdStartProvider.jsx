import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Server, Clock, RotateCw, X } from "lucide-react";
import { useColdStart } from "../../hooks/useColdStart";
import { useToast } from "../ui/Toast";
import { Button } from "../ui/Button";

const COPY = {
  wakingTitle: "Waking up the server",
  wakingBody:
    "This app runs on a free tier that goes to sleep when it's not in use. It's starting back up now — this usually takes about 30 to 60 seconds. Thanks for your patience.",
  onlineToast: "You're all set — the server is awake and ready.",
  offlineTitle: "Almost there — taking a little longer than usual",
  offlineBody:
    "The server is still finishing its wake-up. Free-tier instances occasionally need an extra moment. You can keep waiting or give it a nudge.",
};

const ServerStatusContext = createContext({
  status: "idle",
  isWaking: false,
  isOnline: true,
  isOffline: false,
  elapsed: 0,
  retry: () => {},
});

export function useServerStatus() {
  return useContext(ServerStatusContext);
}

export function ColdStartProvider({ children }) {
  const { status, elapsed, retry } = useColdStart();
  const { toast } = useToast();
  const prevStatus = useRef(status);
  const reduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);

  // Fire a one-time success toast on the transition edge into "online".
  useEffect(() => {
    if (prevStatus.current !== "online" && status === "online") {
      const wasWaking =
        prevStatus.current === "waking" || prevStatus.current === "offline";
      if (wasWaking) toast({ variant: "success", title: COPY.onlineToast });
    }
    // A fresh waking cycle re-shows a previously dismissed banner.
    if (status === "checking" || status === "waking") setDismissed(false);
    prevStatus.current = status;
  }, [status, toast]);

  const isWaking = status === "waking";
  const isOffline = status === "offline";
  const showBanner = (isWaking || isOffline) && !dismissed;

  const ctx = {
    status,
    isWaking,
    isOnline: status === "online",
    isOffline,
    elapsed,
    retry,
  };

  return (
    <ServerStatusContext.Provider value={ctx}>
      {children}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            key="coldstart-banner"
            role="status"
            aria-live="polite"
            aria-busy={isWaking}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 top-4 z-[90] mx-auto w-full max-w-md px-4"
          >
            <div className="flex items-start gap-3 rounded-xl border bg-elevated p-4 shadow-pop">
              {isWaking ? (
                reduceMotion ? (
                  <Server className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
                ) : (
                  <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-info" aria-hidden="true" />
                )
              ) : (
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
              )}

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Server className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  {isWaking ? COPY.wakingTitle : COPY.offlineTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isWaking ? COPY.wakingBody : COPY.offlineBody}
                </p>

                {isWaking && (
                  <>
                    {/* Indeterminate progress bar */}
                    <div
                      role="progressbar"
                      aria-label="Server starting up"
                      className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted"
                    >
                      {reduceMotion ? (
                        <div className="h-full w-1/3 rounded-full bg-primary" />
                      ) : (
                        <motion.div
                          className="h-full w-1/3 rounded-full bg-primary"
                          animate={{ x: ["-40%", "240%"] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                        />
                      )}
                    </div>
                    <p className="mt-2 text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                      {elapsed > 50 ? "Nearly there" : "Starting up"}… {elapsed}s
                    </p>
                  </>
                )}

                {isOffline && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={retry} aria-label="Retry connection">
                      <RotateCw className="h-4 w-4" aria-hidden="true" /> Retry connection
                    </Button>
                  </div>
                )}
              </div>

              {isOffline && (
                <button
                  onClick={() => setDismissed(true)}
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ServerStatusContext.Provider>
  );
}
