/** Shared HTTP transport for browser and server API modules. */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

export function jsonRequest(method: string, body?: unknown, signal?: AbortSignal): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...(signal ? { signal } : {}),
  };
}

export function withQuery(path: string, query?: string | URLSearchParams): string {
  if (!query) return path;
  const search = typeof query === "string" ? query : query.toString();
  return search ? `${path}?${search}` : path;
}
