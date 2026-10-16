import { redirect } from "next/navigation";
import { RecentOrdersList } from "@ssr/ui";
import { getSessionTokens } from "@/auth";
import { fetchRecentOrders, UnauthorizedError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tokens = await getSessionTokens();
  if (typeof tokens?.accessToken !== "string") redirect("/login");

  let orders;
  try {
    orders = await fetchRecentOrders(tokens.accessToken, {
      baseUrl: process.env.API_BASE_URL ?? "http://localhost:5100",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/login");
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
      <h2 className="mb-2 text-lg font-medium">Recent orders</h2>
      <RecentOrdersList orders={orders} />
    </main>
  );
}
