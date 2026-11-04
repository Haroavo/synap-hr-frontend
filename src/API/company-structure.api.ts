import { apiFetch, jsonRequest, withQuery } from "./http";

export type CompanyStructureResource = "departments" | "positions" | "contract-types";

export const companyStructureApi = {
  list: (resource: CompanyStructureResource, query?: string | URLSearchParams, signal?: AbortSignal) =>
    apiFetch(withQuery(`/api/${resource}`, query), { signal, cache: "no-store" }),
  create: (resource: CompanyStructureResource, payload: unknown) =>
    apiFetch(`/api/${resource}`, jsonRequest("POST", payload)),
  update: (resource: CompanyStructureResource, id: string, payload: unknown) =>
    apiFetch(`/api/${resource}/${encodeURIComponent(id)}`, jsonRequest("PATCH", payload)),
  remove: (resource: CompanyStructureResource, id: string) =>
    apiFetch(`/api/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
