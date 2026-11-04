import { proxyBackOfficeApi } from "@/lib/server/backoffice-api-proxy";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const incomingUrl = new URL(request.url);
  const query = incomingUrl.searchParams.toString();
  return proxyBackOfficeApi(`/contracts${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Les données envoyées sont invalides." }, { status: 400 });
  }

  return proxyBackOfficeApi("/contracts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
