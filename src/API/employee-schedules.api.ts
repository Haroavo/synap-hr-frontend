import { apiFetch, jsonRequest } from "./http";

export const employeeSchedulesApi = {
  get: (employeeId: string, signal?: AbortSignal) =>
    apiFetch(`/api/employee-schedules/${encodeURIComponent(employeeId)}`, { signal, cache: "no-store" }),
  attendanceSummary: (employeeId: string, signal?: AbortSignal) =>
    apiFetch(`/api/employee-schedules/${encodeURIComponent(employeeId)}/attendance-summary`, { signal, cache: "no-store" }),
  update: (employeeId: string, payload: unknown) =>
    apiFetch(`/api/employee-schedules/${encodeURIComponent(employeeId)}`, jsonRequest("PATCH", payload)),
};
