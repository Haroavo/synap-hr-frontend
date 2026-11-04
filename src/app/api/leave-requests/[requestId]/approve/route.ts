import {
  proxyBackOfficeApi,
} from "@/lib/server/backoffice-api-proxy";

export async function PATCH(
  _request: Request,
  context: {
    params: Promise<{
      requestId: string;
    }>;
  },
) {
  const {
    requestId,
  } = await context.params;

  return proxyBackOfficeApi(
    `/leave-requests/${encodeURIComponent(requestId)}/approve`,
    {
      method: "PATCH",
    },
  );
}
