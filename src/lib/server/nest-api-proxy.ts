import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "synaprh_access_token";

function getBackendUrl(): string | null {
  const backendUrl = process.env.NEST_API_URL?.trim();

  if (!backendUrl) {
    return null;
  }

  return backendUrl.replace(/\/$/, "");
}

async function readBackendResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json().catch(() => ({
      message: "La réponse JSON du backend est invalide.",
    }));
  }

  const text = await response.text().catch(() => "");

  return {
    message: text || `Le backend a retourné le statut ${response.status}.`,
  };
}

export async function proxyNestJson(
  backendPath: string,
  init: RequestInit = {},
) {
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

  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");

  headers.set("Authorization", `Bearer ${accessToken}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const targetUrl = `${backendUrl}${backendPath}`;

    console.log(`${init.method ?? "GET"} ${targetUrl}`);

    const backendResponse = await fetch(targetUrl, {
      ...init,

      headers,

      cache: "no-store",
    });

    const data = await readBackendResponse(backendResponse);

    if (backendResponse.status === 204) {
      return new NextResponse(null, {
        status: 204,
      });
    }

    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error(`Erreur du proxy NestJS pour ${backendPath} :`, error);

    return NextResponse.json(
      {
        message: "Impossible de communiquer avec le backend NestJS.",
      },
      {
        status: 503,
      },
    );
  }
}
