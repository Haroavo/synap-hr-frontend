import {
  cookies,
} from "next/headers";

import {
  NextResponse,
} from "next/server";

const BACK_OFFICE_ACCESS_TOKEN_COOKIE =
  "synaprh_access_token";

function getNestApiBaseUrl(): string {
  const baseUrl =
    process.env.NEST_API_URL?.trim();

  if (!baseUrl) {
    throw new Error(
      "La variable NEST_API_URL n'est pas configurée.",
    );
  }

  return baseUrl.replace(/\/$/, "");
}

function getNestApiUrl(
  path: string,
): string {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${getNestApiBaseUrl()}${normalizedPath}`;
}

async function readBackendResponse(
  response: Response,
): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({
      message:
        "La réponse JSON du backend est invalide.",
    }));
  }

  const text =
    await response.text().catch(() => "");

  return {
    message:
      text ||
      `Le backend a retourné le statut ${response.status}.`,
  };
}

export async function proxyBackOfficeApi(
  path: string,
  init: RequestInit,
): Promise<NextResponse> {
  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      BACK_OFFICE_ACCESS_TOKEN_COOKIE,
    )?.value;

  if (!accessToken) {
    return NextResponse.json(
      {
        message:
          "Vous devez être connecté au back-office.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const headers =
      new Headers(init.headers);

    headers.set(
      "Accept",
      "application/json",
    );

    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );

    const backendResponse =
      await fetch(
        getNestApiUrl(path),
        {
          ...init,
          headers,
          cache: "no-store",
        },
      );

    const data =
      await readBackendResponse(
        backendResponse,
      );

    const response =
      NextResponse.json(
        data,
        {
          status:
            backendResponse.status,
        },
      );

    if (
      backendResponse.status === 401 ||
      backendResponse.status === 403
    ) {
      response.cookies.set(
        BACK_OFFICE_ACCESS_TOKEN_COOKIE,
        "",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          expires: new Date(0),
        },
      );
    }

    return response;
  } catch (error) {
    console.error(
      `Erreur proxy back-office ${path} :`,
      error,
    );

    return NextResponse.json(
      {
        message:
          "Impossible de communiquer avec le backend.",
      },
      {
        status: 503,
      },
    );
  }
}
