import { cookies } from "next/headers";

import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "synaprh_access_token";

type RouteContext = {
  params: Promise<{
    employeeId: string;
  }>;
};

function getBackendUrl(): string | null {
  const backendUrl = process.env.NEST_API_URL?.replace(/\/$/, "");

  return backendUrl ?? null;
}

async function readBackendResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json().catch(() => ({
      message: "La réponse du serveur est invalide.",
    }));
  }

  const text = await response.text().catch(() => "");

  return {
    message: text || "La réponse du serveur est invalide.",
  };
}

export async function GET(request: Request, context: RouteContext) {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    return NextResponse.json(
      {
        message: "La variable NEST_API_URL n’est pas configurée.",
      },
      {
        status: 500,
      },
    );
  }

  const cookieStore = await cookies();

  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      {
        message: "Vous devez être authentifié.",
      },
      {
        status: 401,
      },
    );
  }

  const { employeeId } = await context.params;

  const requestUrl = new URL(request.url);

  /*
   * Transmet startDate, endDate et days
   * directement au backend NestJS.
   */
  const queryString = requestUrl.searchParams.toString();

  const targetUrl = [
    `${backendUrl}/employee-schedules`,

    encodeURIComponent(employeeId),

    "attendance-summary",
  ].join("/");

  try {
    const backendResponse = await fetch(
      queryString ? `${targetUrl}?${queryString}` : targetUrl,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${accessToken}`,

          Accept: "application/json",
        },

        cache: "no-store",
      },
    );

    const data = await readBackendResponse(backendResponse);

    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("Erreur API du planning :", error);

    return NextResponse.json(
      {
        message: "Le backend est inaccessible.",
      },
      {
        status: 503,
      },
    );
  }
}
