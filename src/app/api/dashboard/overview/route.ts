import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

export function GET() {
  return proxyBackOfficeApi("/dashboard/overview", { method: "GET" });
}
