import { NextResponse } from "next/server";

type LoginRequest = {
  username?: unknown;
  password?: unknown;
};

type NestLoginResponse = {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: {
    id: string;
    employeeId: string;
    username: string;
    roles: string[];
    mustChangePassword: boolean;
  };
  message?: string | string[];
};

const COOKIE_NAME = "synaprh_access_token";

function getErrorMessage(data: NestLoginResponse | null): string {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  return data?.message ?? "Identifiant ou mot de passe incorrect";
}

export async function POST(request: Request) {
  const apiUrl = process.env.NEST_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      {
        message:
          "La variable NEST_API_URL n'est pas configurée dans le frontend.",
      },
      {
        status: 500,
      },
    );
  }

  let requestBody: LoginRequest;

  try {
    requestBody = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json(
      {
        message: "Le corps de la requête est invalide.",
      },
      {
        status: 400,
      },
    );
  }

  const username =
    typeof requestBody.username === "string" ? requestBody.username.trim() : "";

  const password =
    typeof requestBody.password === "string" ? requestBody.password : "";

  if (!username || !password) {
    return NextResponse.json(
      {
        message: "L'identifiant et le mot de passe sont obligatoires.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const nestResponse = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
      cache: "no-store",
    });

    const data = (await nestResponse
      .json()
      .catch(() => null)) as NestLoginResponse | null;

    if (!nestResponse.ok) {
      return NextResponse.json(
        {
          message: getErrorMessage(data),
        },
        {
          status: nestResponse.status,
        },
      );
    }

    if (!data?.accessToken || !data.user) {
      return NextResponse.json(
        {
          message: "La réponse du serveur d'authentification est invalide.",
        },
        {
          status: 502,
        },
      );
    }

    const expiresIn = Number(data.expiresIn);
    const cookieDuration =
      Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 900;

    const response = NextResponse.json(
      {
        user: data.user,
      },
      {
        status: 200,
      },
    );

    response.cookies.set({
      name: COOKIE_NAME,
      value: data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieDuration,
      priority: "high",
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        message:
          "Impossible de communiquer avec le backend. Vérifiez que NestJS est démarré.",
      },
      {
        status: 503,
      },
    );
  }
}
