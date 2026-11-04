import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

export function GET(request: Request) {
  const months = new URL(request.url).searchParams.get("months") ?? "12";
  return proxyBackOfficeApi(`/dashboard/analytics?months=${encodeURIComponent(months)}`, { method: "GET" });
}
