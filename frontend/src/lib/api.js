import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const HEALTH_PATH = "/health";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // Generous timeout: free-tier (Render) instances can take ~50-60s to wake
  // from a cold start, so a short timeout would abort mid-wake and look broken.
  timeout: 70000,
});

/** Extract a human-readable message from our uniform error envelope. */
export function getErrorMessage(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (Array.isArray(data?.error?.details) && data.error.details.length) {
    const first = data.error.details[0];
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : "";
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }
  if (typeof data?.detail === "string") return data.detail;
  if (error?.message) return error.message;
  return fallback;
}

export function getErrorDetails(error) {
  return error?.response?.data?.error?.details ?? null;
}
