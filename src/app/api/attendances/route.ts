import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";

const ACCESS_TOKEN_COOKIE = "synaprh_access_token";

function getBackendUrl(): string | null {
  const backendUrl = process.env.NEST_API_URL;

  if (!backendUrl) {
    return null;
  }

  return backendUrl.replace(/\/$/, "");
}

async function parseResponse(response: Response): Promise<unknown> {
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

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return proxyBackOfficeApi(`/attendances${query ? `?${query}` : ""}`, { method: "GET" });
}

/*
 * POST /api/attendances
 *
 * Cette route reçoit le formulaire Next.js puis transmet
 * les données au backend NestJS.
 */
export async function POST(request: Request) {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    return NextResponse.json(
      {
        message:
          "La variable NEST_API_URL n’est pas configurée dans le frontend.",
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Les données envoyées sont invalides.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const backendResponse = await fetch(`${backendUrl}/attendances`, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),

      cache: "no-store",
    });

    const data = await parseResponse(backendResponse);

    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error("Erreur API de pointage :", error);

    return NextResponse.json(
      {
        message:
          "Le backend de pointage est inaccessible. Vérifiez que NestJS est démarré.",
      },
      {
        status: 503,
      },
    );
  }
}
