import type { Order, RevenueSummary } from "@ssr/ui";

export class UnauthorizedError extends Error {}

export async function fetchRecentOrders(
  accessToken: string,
  options: { baseUrl: string; fetch?: typeof fetch },
): Promise<Order[]> {
  const doFetch = options.fetch ?? fetch;
  const response = await doFetch(new URL("/orders/recent", options.baseUrl), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new Error(`Orders request failed with ${response.status}`);
  return (await response.json()) as Order[];
}

export async function fetchRevenueSummary(
  accessToken: string,
  options: { baseUrl: string; fetch?: typeof fetch },
): Promise<RevenueSummary> {
  const doFetch = options.fetch ?? fetch;
  const response = await doFetch(new URL("/orders/summary", options.baseUrl), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new Error(`Summary request failed with ${response.status}`);
  return (await response.json()) as RevenueSummary;
}
