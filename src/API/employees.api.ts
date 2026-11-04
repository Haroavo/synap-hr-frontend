import { apiFetch, jsonRequest, withQuery } from "./http";

export const employeesApi = {
  list: (query?: string | URLSearchParams, signal?: AbortSignal) =>
    apiFetch(withQuery("/api/employees", query), { signal, cache: "no-store" }),
  creationOptions: (signal?: AbortSignal) =>
    apiFetch("/api/employees/creation-options", { signal, cache: "no-store" }),
  create: (payload: unknown) => apiFetch("/api/employees", jsonRequest("POST", payload)),
  update: (employeeId: string, payload: unknown) =>
    apiFetch(`/api/employees/${encodeURIComponent(employeeId)}`, jsonRequest("PATCH", payload)),
  profile: (employeeId: string, signal?: AbortSignal) =>
    apiFetch(`/api/employees/${encodeURIComponent(employeeId)}/profile`, { signal, cache: "no-store" }),
  organizationChart: (signal?: AbortSignal) =>
    apiFetch("/api/employees/organization-chart", { signal, cache: "no-store" }),
};
