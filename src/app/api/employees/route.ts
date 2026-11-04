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
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const departmentId = searchParams.get("departmentId");
  const contractTypeId = searchParams.get("contractTypeId");

  const backendParams = new URLSearchParams({
    page,
    limit,
    sortBy,
    sortOrder,
  });
  if (search) backendParams.set("search", search);
  if (status) backendParams.set("status", status);
  if (departmentId) backendParams.set("departmentId", departmentId);
  if (contractTypeId) backendParams.set("contractTypeId", contractTypeId);

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

export async function POST(request: Request) {
  const { apiUrl, token } = await getAuthentication();
  if (!apiUrl || !token) {
    return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Les données envoyées sont invalides." }, { status: 400 });
  }

  try {
    const response = await fetch(`${apiUrl}/employees`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Le service des employés est indisponible." }, { status: 503 });
  }
}
