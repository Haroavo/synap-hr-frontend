import {
  NextResponse,
} from "next/server";

import {
  proxyBackOfficeApi,
} from "@/lib/server/backoffice-api-proxy";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      requestId: string;
    }>;
  },
) {
  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        message:
          "Le motif du refus est invalide.",
      },
      {
        status: 400,
      },
    );
  }

  const {
    requestId,
  } = await context.params;

  return proxyBackOfficeApi(
    `/leave-requests/${encodeURIComponent(requestId)}/reject`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body:
        JSON.stringify(body),
    },
  );
}
