import { money } from "./format";
import type { Order } from "./orders";
import { PlainLink, type LinkComponent } from "./OrderLink";

const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function OrderDetail({ order, Link = PlainLink }: { order: Order; Link?: LinkComponent }) {
  return (
    <article>
      <Link href="/" className="text-sm text-blue-700 hover:underline">
        ← Back to the Dashboard
      </Link>
      <h2 className="mt-3 text-xl font-semibold">{order.number}</h2>
      <dl className="mb-6 mt-2 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-slate-500">Customer</dt>
        <dd>{order.customer}</dd>
        <dt className="text-slate-500">Status</dt>
        <dd>{order.status}</dd>
        <dt className="text-slate-500">Placed</dt>
        <dd>{date.format(new Date(order.placedAt))}</dd>
        <dt className="text-slate-500">Total</dt>
        <dd className="tabular-nums">{money.format(order.total)}</dd>
      </dl>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2 font-medium">Product</th>
            <th className="py-2 text-right font-medium">Quantity</th>
            <th className="py-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {order.lineItems.map((item, index) => (
            <tr key={index} className="border-b border-slate-100">
              <td className="py-2">{item.product}</td>
              <td className="py-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 text-right tabular-nums">{money.format(item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

export function OrderNotFound({ Link = PlainLink }: { Link?: LinkComponent }) {
  return (
    <div>
      <p role="alert" className="mb-2 text-slate-700">
        Order not found.
      </p>
      <Link href="/" className="text-sm text-blue-700 hover:underline">
        ← Back to the Dashboard
      </Link>
    </div>
  );
}
