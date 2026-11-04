import { apiFetch, jsonRequest } from "./http";

export const authApi = {
  login: (payload: unknown) => apiFetch("/api/auth/login", jsonRequest("POST", payload)),
  logout: () => apiFetch("/api/auth/logout", jsonRequest("POST")),
  forgotPassword: (payload: unknown) => apiFetch("/api/auth/forgot-password", jsonRequest("POST", payload)),
  resetPassword: (payload: unknown) => apiFetch("/api/auth/reset-password", jsonRequest("POST", payload)),
};
