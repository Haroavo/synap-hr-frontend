import { apiFetch, jsonRequest, withQuery } from "./http";

export const contractsApi = {
  list: (query?: string | URLSearchParams, signal?: AbortSignal) =>
    apiFetch(withQuery("/api/contracts", query), { signal, cache: "no-store" }),
  options: (signal?: AbortSignal) =>
    apiFetch("/api/contracts/options", { signal, cache: "no-store" }),
  create: (payload: unknown) =>
    apiFetch("/api/contracts", jsonRequest("POST", payload)),
  update: (contractId: string, payload: unknown) =>
    apiFetch(`/api/contracts/${encodeURIComponent(contractId)}`, jsonRequest("PATCH", payload)),
};
