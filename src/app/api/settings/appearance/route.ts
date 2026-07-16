import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "synaprh_access_token";

async function getAuthentication() {
  const apiUrl = process.env.NEST_API_URL;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return {
    apiUrl,
    token,
  };
}

export async function GET() {
  console.log("[APPARENCE API] GET");

  const { apiUrl, token } = await getAuthentication();

  if (!apiUrl || !token) {
    return NextResponse.json(
      {
        message: "Non authentifié",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const response = await fetch(`${apiUrl}/settings/appearance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
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
        message: "Le service des paramètres est indisponible.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function PATCH(request: Request) {
  console.log("[APPARENCE API] PATCH");

  const { apiUrl, token } = await getAuthentication();

  if (!apiUrl || !token) {
    return NextResponse.json(
      {
        message: "Non authentifié",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${apiUrl}/settings/appearance`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Le service des paramètres est indisponible.",
      },
      {
        status: 503,
      },
    );
  }
}
