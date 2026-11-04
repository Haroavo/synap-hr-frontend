import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

export function GET() {
  return proxyBackOfficeApi("/contracts/options", { method: "GET" });
}
