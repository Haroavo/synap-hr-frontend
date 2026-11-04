import { apiFetch, jsonRequest, withQuery } from "./http";

export const leaveRequestsApi = {
  list: (query?: string | URLSearchParams, signal?: AbortSignal) =>
    apiFetch(withQuery("/api/leave-requests", query), { signal, cache: "no-store" }),
  approve: (requestId: string) =>
    apiFetch(`/api/leave-requests/${encodeURIComponent(requestId)}/approve`, { method: "PATCH" }),
  reject: (requestId: string, payload: unknown) =>
    apiFetch(`/api/leave-requests/${encodeURIComponent(requestId)}/reject`, jsonRequest("PATCH", payload)),
};
