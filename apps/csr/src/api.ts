import type { Order } from "@ssr/ui";

export class UnauthorizedError extends Error {}

export async function fetchRecentOrders(signal?: AbortSignal): Promise<Order[]> {
  const response = await fetch("/api/orders/recent", { signal });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new Error(`Orders request failed with ${response.status}`);
  return (await response.json()) as Order[];
}
