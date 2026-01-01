import { apiClient } from "./apiClient";

/**
 * Get logged-in user's profile
 * Requires valid JWT
 */
export async function getProfile(token: string) {
  const response = await apiClient("/api/users/me", {}, token);
  return response.json();
}
