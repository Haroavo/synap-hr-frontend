import { apiFetch, withQuery } from "./http";

export const dashboardApi = {
  overview: (signal?: AbortSignal) =>
    apiFetch("/api/dashboard/overview", { signal, cache: "no-store" }),
  analytics: (months: number, signal?: AbortSignal) =>
    apiFetch(`/api/dashboard/analytics?months=${months}`, { signal, cache: "no-store" }),
  calendar: (startDate: string, endDate: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ startDate, endDate });
    return apiFetch(withQuery("/api/dashboard/calendar", query), { signal, cache: "no-store" });
  },
};
