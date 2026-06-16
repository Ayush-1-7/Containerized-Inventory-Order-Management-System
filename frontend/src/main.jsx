import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { ColdStartProvider } from "./components/system/ColdStartProvider.jsx";
import "./index.css";

// Fail fast on genuine client errors (4xx, except 408/429); otherwise retry —
// this bridges the ~50-60s cold start of a sleeping free-tier backend.
const shouldRetry = (failureCount, error) => {
  const s = error?.response?.status;
  if (s && s >= 400 && s < 500 && s !== 408 && s !== 429) return false;
  return failureCount < 3;
};
const retryDelay = (attemptIndex) =>
  Math.min(1000 * 2 ** attemptIndex, 8000) + Math.random() * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay,
      // Always attempt the request (don't pause on the browser's online
      // heuristic) so the cold-start retry logic runs and genuine failures
      // reach a real error state instead of a misleading "no data" limbo.
      networkMode: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // auto-recover after a late wake
      staleTime: 15_000,
    },
    mutations: {
      retry: (failureCount, error) =>
        shouldRetry(failureCount, error) && failureCount < 2,
      retryDelay,
      networkMode: "always",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ColdStartProvider>
            <BrowserRouter
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <App />
            </BrowserRouter>
          </ColdStartProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
