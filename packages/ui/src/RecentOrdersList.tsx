import { money } from "./format";
import type { Order } from "./orders";
import { PlainLink, type LinkComponent } from "./OrderLink";

const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function RecentOrdersList({ orders, Link = PlainLink }: { orders: readonly Order[]; Link?: LinkComponent }) {
  if (orders.length === 0) {
    return <p className="text-slate-500">No orders yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-200 text-slate-500">
        <tr>
          <th className="py-2 font-medium">Order</th>
          <th className="py-2 font-medium">Customer</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">Placed</th>
          <th className="py-2 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-b border-slate-100">
            <td className="py-2 font-medium">
              <Link href={`/orders/${order.id}`} className="text-blue-700 hover:underline">
                {order.number}
              </Link>
            </td>
            <td className="py-2">{order.customer}</td>
            <td className="py-2">{order.status}</td>
            <td className="py-2">{date.format(new Date(order.placedAt))}</td>
            <td className="py-2 text-right tabular-nums">{money.format(order.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
