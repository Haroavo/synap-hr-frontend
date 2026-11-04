import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

export function GET(request: Request) {
  const incomingUrl = new URL(request.url);
  const query = new URLSearchParams();
  const startDate = incomingUrl.searchParams.get("startDate");
  const endDate = incomingUrl.searchParams.get("endDate");
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : "";
  return proxyBackOfficeApi(`/dashboard/calendar${suffix}`, { method: "GET" });
}
