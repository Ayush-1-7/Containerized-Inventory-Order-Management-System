import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
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
