import { apiFetch, jsonRequest } from "./http";

export const appearanceSettingsApi = {
  get: (signal?: AbortSignal) => apiFetch("/api/settings/appearance", { signal, cache: "no-store" }),
  update: (payload: unknown, signal?: AbortSignal) =>
    apiFetch("/api/settings/appearance", jsonRequest("PATCH", payload, signal)),
};
