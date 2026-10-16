import { notFound, redirect } from "next/navigation";
import { OrderDetail, withLatency } from "@ssr/ui";
import { OrderLink } from "@/components/OrderLink";
import { getSessionTokens } from "@/auth";
import { loginUrl } from "@/lib/login";
import { fetchOrder, UnauthorizedError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ latency?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const latency = typeof query.latency === "string" ? query.latency : undefined;
  const login = loginUrl(withLatency(`/orders/${encodeURIComponent(id)}`, latency));
  const tokens = await getSessionTokens();
  if (typeof tokens?.accessToken !== "string") redirect(login);

  const options = { baseUrl: process.env.API_BASE_URL ?? "http://localhost:5100", latency };
  let order;
  try {
    order = await fetchOrder(tokens.accessToken, id, options);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect(login);
    throw error;
  }
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <OrderDetail order={order} Link={OrderLink} />
    </main>
  );
}
