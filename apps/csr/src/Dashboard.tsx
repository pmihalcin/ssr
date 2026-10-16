import { useEffect, useState } from "react";
import { RecentOrdersList, RevenueSummaryCards, type Order, type RevenueSummary } from "@ssr/ui";
import { fetchRecentOrders, fetchRevenueSummary, UnauthorizedError } from "./api";

function login() {
  const returnUrl = window.location.pathname + window.location.search;
  window.location.assign(`/bff/login?returnUrl=${encodeURIComponent(returnUrl)}`);
}

type State = { status: "loading" } | { status: "error" } | { status: "loaded"; orders: Order[] };

type SummaryState = { status: "loading" } | { status: "error" } | { status: "loaded"; summary: RevenueSummary };

export function Dashboard({ onSessionExpired = login }: { onSessionExpired?: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [summary, setSummary] = useState<SummaryState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetchRecentOrders(controller.signal).then(
      (orders) => setState({ status: "loaded", orders }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof UnauthorizedError) onSessionExpired();
        else setState({ status: "error" });
      },
    );
    fetchRevenueSummary(controller.signal).then(
      (loaded) => setSummary({ status: "loaded", summary: loaded }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof UnauthorizedError) onSessionExpired();
        else setSummary({ status: "error" });
      },
    );
    return () => controller.abort();
  }, [onSessionExpired]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form method="post" action="/bff/logout">
          <button type="submit" className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">
            Log out
          </button>
        </form>
      </header>
      {summary.status === "loading" && <p className="mb-8 text-slate-500">Loading summary…</p>}
      {summary.status === "error" && (
        <p role="alert" className="mb-8 text-red-700">
          Could not load the revenue summary.
        </p>
      )}
      {summary.status === "loaded" && <RevenueSummaryCards summary={summary.summary} />}
      <h2 className="mb-2 text-lg font-medium">Recent orders</h2>
      {state.status === "loading" && <p className="text-slate-500">Loading orders…</p>}
      {state.status === "error" && (
        <p role="alert" className="text-red-700">
          Could not load orders.
        </p>
      )}
      {state.status === "loaded" && <RecentOrdersList orders={state.orders} />}
    </main>
  );
}
