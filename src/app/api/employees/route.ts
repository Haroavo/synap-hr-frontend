import { cookies } from "next/headers";

import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "synaprh_access_token";

async function getAuthentication() {
  const apiUrl = process.env.NEST_API_URL;

  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

  return {
    apiUrl: apiUrl?.replace(/\/$/, ""),

    token,
  };
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl;

  const page = searchParams.get("page") ?? "1";

  const limit = searchParams.get("limit") ?? "10";

  const sortBy = searchParams.get("sortBy") ?? "createdAt";

  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const backendParams = new URLSearchParams({
    page,
    limit,
    sortBy,
    sortOrder,
  });

  try {
    const response = await fetch(
      `${apiUrl}/employees?${backendParams.toString()}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
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
        message: "Le service des employés est indisponible.",
      },
      {
        status: 503,
      },
    );
  }
}
