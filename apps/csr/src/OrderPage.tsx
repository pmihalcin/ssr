import { useEffect, useState } from "react";
import { OrderDetail, OrderNotFound, type Order } from "@ssr/ui";
import { fetchOrder, UnauthorizedError } from "./api";
import { Link } from "./router";

function login() {
  const returnUrl = window.location.pathname + window.location.search;
  window.location.assign(`/bff/login?returnUrl=${encodeURIComponent(returnUrl)}`);
}

type State = { status: "loading" } | { status: "error" } | { status: "loaded"; order: Order | null };

export function OrderPage({ id, onSessionExpired = login }: { id: string; onSessionExpired?: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });
    const controller = new AbortController();
    fetchOrder(id, controller.signal).then(
      (order) => setState({ status: "loaded", order }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof UnauthorizedError) onSessionExpired();
        else setState({ status: "error" });
      },
    );
    return () => controller.abort();
  }, [id, onSessionExpired]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      {state.status === "loading" && <p className="text-slate-500">Loading order…</p>}
      {state.status === "error" && (
        <p role="alert" className="text-red-700">
          Could not load the order.
        </p>
      )}
      {state.status === "loaded" &&
        (state.order ? <OrderDetail order={state.order} Link={Link} /> : <OrderNotFound Link={Link} />)}
    </main>
  );
}
