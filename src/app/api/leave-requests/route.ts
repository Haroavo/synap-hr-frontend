import {
  proxyBackOfficeApi,
} from "@/lib/server/backoffice-api-proxy";

export async function GET(
  request: Request,
) {
  const url =
    new URL(request.url);

  const query =
    url.searchParams.toString();

  const path =
    query
      ? `/leave-requests?${query}`
      : "/leave-requests";

  return proxyBackOfficeApi(
    path,
    {
      method: "GET",
    },
  );
}
