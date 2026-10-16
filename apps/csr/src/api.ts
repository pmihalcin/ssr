import { latencyHeaders, type Order, type RevenueSummary } from "@ssr/ui";

export class UnauthorizedError extends Error {}

function pageLatencyHeaders() {
  return latencyHeaders(new URLSearchParams(window.location.search).get("latency"));
}

export async function fetchRecentOrders(signal?: AbortSignal): Promise<Order[]> {
  const response = await fetch("/api/orders/recent", { signal, headers: pageLatencyHeaders() });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new Error(`Orders request failed with ${response.status}`);
  return (await response.json()) as Order[];
}

export async function fetchRevenueSummary(signal?: AbortSignal): Promise<RevenueSummary> {
  const response = await fetch("/api/orders/summary", { signal, headers: pageLatencyHeaders() });
  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) throw new Error(`Summary request failed with ${response.status}`);
  return (await response.json()) as RevenueSummary;
}

/** Resolves to null when the Order doesn't exist. */
export async function fetchOrder(id: string, signal?: AbortSignal): Promise<Order | null> {
  const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { signal, headers: pageLatencyHeaders() });
  if (response.status === 401) throw new UnauthorizedError();
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Order request failed with ${response.status}`);
  return (await response.json()) as Order;
}
