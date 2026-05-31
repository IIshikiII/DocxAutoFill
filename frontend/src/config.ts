/** Base URL of the backend API. Override via the `VITE_API_URL` env var. */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";
