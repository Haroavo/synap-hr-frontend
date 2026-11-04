import { NextResponse } from "next/server";

import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

type RouteContext = {
  params: Promise<{ contractId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Les données envoyées sont invalides." }, { status: 400 });
  }

  const { contractId } = await context.params;
  return proxyBackOfficeApi(`/contracts/${encodeURIComponent(contractId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
