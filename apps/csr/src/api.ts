import type { Order, RevenueSummary } from "@ssr/ui";

export class UnauthorizedError extends Error {}

export async function fetchRecentOrders(signal?: AbortSignal): Promise<Order[]> {
  const response = await fetch("/api/orders/recent", { signal });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new Error(`Orders request failed with ${response.status}`);
  return (await response.json()) as Order[];
}

export async function fetchRevenueSummary(signal?: AbortSignal): Promise<RevenueSummary> {
  const response = await fetch("/api/orders/summary", { signal });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new Error(`Summary request failed with ${response.status}`);
  return (await response.json()) as RevenueSummary;
}
