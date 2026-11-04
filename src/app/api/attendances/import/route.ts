import { NextResponse } from "next/server";

import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Les données envoyées sont invalides." }, { status: 400 });
  }
  return proxyBackOfficeApi("/attendances/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
