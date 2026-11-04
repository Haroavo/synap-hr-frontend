import { NextResponse } from "next/server";

import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

type RouteContext = { params: Promise<{ attendanceId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Les données envoyées sont invalides." }, { status: 400 });
  }
  const { attendanceId } = await context.params;
  return proxyBackOfficeApi(`/attendances/${encodeURIComponent(attendanceId)}/void`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
