import { apiFetch, jsonRequest, withQuery } from "./http";

export const attendancesApi = {
  list: (query?: string | URLSearchParams, signal?: AbortSignal) =>
    apiFetch(withQuery("/api/attendances", query), { signal, cache: "no-store" }),
  create: (payload: unknown) => apiFetch("/api/attendances", jsonRequest("POST", payload)),
  import: (payload: unknown) => apiFetch("/api/attendances/import", jsonRequest("POST", payload)),
  correct: (attendanceId: string, payload: unknown) =>
    apiFetch(`/api/attendances/${encodeURIComponent(attendanceId)}/correct`, jsonRequest("PATCH", payload)),
  void: (attendanceId: string, payload: unknown) =>
    apiFetch(`/api/attendances/${encodeURIComponent(attendanceId)}/void`, jsonRequest("PATCH", payload)),
};
