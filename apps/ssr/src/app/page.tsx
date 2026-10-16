import { redirect } from "next/navigation";
import { RecentOrdersList, RevenueSummaryCards, withLatency } from "@ssr/ui";
import { getSessionTokens } from "@/auth";
import { loginUrl } from "@/lib/login";
import { fetchRecentOrders, fetchRevenueSummary, UnauthorizedError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ latency?: string | string[] }>;
}) {
  const params = await searchParams;
  const latency = typeof params.latency === "string" ? params.latency : undefined;
  const login = loginUrl(withLatency("/", latency));
  const tokens = await getSessionTokens();
  if (typeof tokens?.accessToken !== "string") redirect(login);

  const options = { baseUrl: process.env.API_BASE_URL ?? "http://localhost:5100", latency };
  let orders, summary;
  try {
    [orders, summary] = await Promise.all([
      fetchRecentOrders(tokens.accessToken, options),
      fetchRevenueSummary(tokens.accessToken, options),
    ]);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect(login);
    throw error;
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form method="post" action="/logout">
          <button type="submit" className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">
            Log out
          </button>
        </form>
      </header>
      <RevenueSummaryCards summary={summary} />
      <h2 className="mb-2 text-lg font-medium">Recent orders</h2>
      <RecentOrdersList orders={orders} />
    </main>
  );
}
