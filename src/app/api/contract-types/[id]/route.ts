import { type NextRequest } from "next/server";
import { proxyCompanyStructure } from "@/lib/server/company-structure-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxyCompanyStructure(request, "contract-types", (await params).id);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return proxyCompanyStructure(request, "contract-types", (await params).id);
}
