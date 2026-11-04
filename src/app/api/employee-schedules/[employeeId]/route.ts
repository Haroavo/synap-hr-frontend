import { cookies } from "next/headers";

import { type NextRequest, NextResponse } from "next/server";
import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

const COOKIE_NAME = "synaprh_access_token";

type RouteContext = {
  params: Promise<{
    employeeId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { employeeId } = await context.params;

  const apiUrl = process.env.NEST_API_URL?.replace(/\/$/, "");

  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!apiUrl) {
    return NextResponse.json(
      {
        message: "URL du backend non configurée.",
      },
      {
        status: 500,
      },
    );
  }

  if (!token) {
    return NextResponse.json(
      {
        message: "Non authentifié.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const response = await fetch(
      `${apiUrl}/employee-schedules/${encodeURIComponent(employeeId)}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,

          Accept: "application/json",
        },

        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Le service des plannings est indisponible.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { employeeId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Les données envoyées sont invalides." }, { status: 400 });
  }
  return proxyBackOfficeApi(`/employee-schedules/${encodeURIComponent(employeeId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
