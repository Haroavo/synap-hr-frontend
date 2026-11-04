import { NextResponse } from "next/server";

import { proxyNestJson } from "@/lib/server/nest-api-proxy";

/**
 * POST /api/leave-policies/simulate
 *
 * Transmet la simulation au backend NestJS.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Les données de simulation sont invalides.",
      },
      {
        status: 400,
      },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        message: "Les données de simulation sont obligatoires.",
      },
      {
        status: 400,
      },
    );
  }

  return proxyNestJson("/leave-policies/simulate", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(body),
  });
}
