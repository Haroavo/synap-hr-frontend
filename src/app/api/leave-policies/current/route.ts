import { NextResponse } from "next/server";

import { proxyNestJson } from "@/lib/server/nest-api-proxy";

export async function GET() {
  return proxyNestJson("/leave-policies/current", {
    method: "GET",
  });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      {
        message: "Les données envoyées sont invalides.",
      },
      {
        status: 400,
      },
    );
  }

  return proxyNestJson("/leave-policies/current", {
    method: "PUT",

    body: JSON.stringify(body),
  });
}
