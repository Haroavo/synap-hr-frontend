import { apiFetch, jsonRequest } from "./http";

export const leavePoliciesApi = {
  current: (signal?: AbortSignal) => apiFetch("/api/leave-policies/current", { signal, cache: "no-store" }),
  updateCurrent: (payload: unknown, signal?: AbortSignal) =>
    apiFetch("/api/leave-policies/current", jsonRequest("PUT", payload, signal)),
  simulate: (payload: unknown, signal?: AbortSignal) =>
    apiFetch("/api/leave-policies/simulate", jsonRequest("POST", payload, signal)),
};
