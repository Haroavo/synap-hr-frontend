import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiUrl = process.env.NEST_API_URL;

  if (!apiUrl) {
    return NextResponse.json(
      {
        message: "L'adresse du backend n'est pas configurée.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const body = await request.json();

    const nestResponse = await fetch(`${apiUrl}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await nestResponse.json().catch(() => ({
      message: "Réponse invalide du backend.",
    }));

    return NextResponse.json(data, {
      status: nestResponse.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Impossible de communiquer avec le backend.",
      },
      {
        status: 503,
      },
    );
  }
}
