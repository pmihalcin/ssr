import { money } from "./format";
import type { RevenueSummary } from "./orders";

export function RevenueSummaryCards({ summary }: { summary: RevenueSummary }) {
  const stats = [
    { label: "Total revenue", value: money.format(summary.totalRevenue) },
    { label: "Orders", value: String(summary.orderCount) },
    { label: "Average order value", value: money.format(summary.averageOrderValue) },
  ];

  return (
    <dl className="mb-8 grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded border border-slate-200 p-4">
          <dt className="text-sm text-slate-500">{stat.label}</dt>
          <dd className="text-2xl font-semibold tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
