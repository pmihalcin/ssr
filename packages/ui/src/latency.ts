export const SIMULATED_LATENCY_HEADER = "X-Simulated-Latency";

/** Headers that ask the API to wait for the page's Simulated Latency, or none when it isn't set. */
export function latencyHeaders(latency: string | null | undefined): Record<string, string> {
  return latency ? { [SIMULATED_LATENCY_HEADER]: latency } : {};
}

/** Keeps the Simulated Latency on a link so it carries over across client-side navigation. */
export function withLatency(href: string, latency: string | null | undefined): string {
  if (!latency) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}latency=${encodeURIComponent(latency)}`;
}
