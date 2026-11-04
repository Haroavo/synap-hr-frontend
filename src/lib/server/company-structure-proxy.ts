import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "synaprh_access_token";
const API_RESOURCES = {
  departments: "departments",
  positions: "positions",
  "contract-types": "contract-types",
} as const;

export type CompanyStructureResource = keyof typeof API_RESOURCES;

export async function proxyCompanyStructure(
  request: NextRequest,
  resource: string,
  id?: string,
) {
  const configuredApiUrl = process.env.NEST_API_URL?.trim().replace(/\/$/, "");
  const apiUrl = configuredApiUrl
    ? configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`
    : null;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const backendResource = API_RESOURCES[resource as CompanyStructureResource];

  if (!backendResource) return NextResponse.json({ message: "Ressource introuvable." }, { status: 404 });
  if (!apiUrl || !token) return NextResponse.json({ message: "Authentification requise." }, { status: apiUrl ? 401 : 500 });

  const query = request.nextUrl.searchParams.toString();
  const target = `${apiUrl}/${backendResource}${id ? `/${encodeURIComponent(id)}` : ""}${query ? `?${query}` : ""}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  let body: string | undefined;
  if (request.method === "POST" || request.method === "PATCH") {
    try {
      body = JSON.stringify(await request.json());
      headers["Content-Type"] = "application/json";
    } catch {
      return NextResponse.json({ message: "Les données envoyées sont invalides." }, { status: 400 });
    }
  }

  try {
    const response = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Le service de structure d’entreprise est indisponible." }, { status: 503 });
  }
}
