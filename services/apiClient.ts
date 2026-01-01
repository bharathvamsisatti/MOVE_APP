import { API_BASE_URL } from "../config/api";

/**
 * Central API helper
 * Handles:
 * - Authorization header
 * - 401 session expiry
 */
export async function apiClient(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // 🔴 Session expired
  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  // 🔴 Other backend errors
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "API_ERROR");
  }

  return response;
}
