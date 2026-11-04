import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "synaprh_access_token";

export async function GET() {
  const apiUrl = process.env.NEST_API_URL?.trim().replace(/\/$/, "");
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!apiUrl || !token) {
    return NextResponse.json({ message: "Non authentifié" }, { status: apiUrl ? 401 : 500 });
  }

  try {
    const response = await fetch(`${apiUrl}/employees/creation-options`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Le service des employés est indisponible." }, { status: 503 });
  }
}
