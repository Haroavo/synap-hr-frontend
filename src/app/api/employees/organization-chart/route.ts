import { cookies } from "next/headers";

import { NextResponse } from "next/server";

const COOKIE_NAME = "synaprh_access_token";

export async function GET() {
  const apiUrl = process.env.NEST_API_URL?.replace(/\/$/, "");

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

  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

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
    const response = await fetch(`${apiUrl}/employees/organization-chart`, {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,

        Accept: "application/json",
      },

      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Le service de l’organigramme est indisponible.",
      },
      {
        status: 503,
      },
    );
  }
}
