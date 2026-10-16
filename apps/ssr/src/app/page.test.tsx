import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { dataVisibleScript, type Order } from "@ssr/ui";
import { getSessionTokens } from "@/auth";
import { fetchRecentOrders, fetchRevenueSummary } from "@/lib/orders";
import DashboardPage from "./page";

vi.mock("@/auth", () => ({ getSessionTokens: vi.fn() }));
vi.mock("@/lib/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/orders")>()),
  fetchRecentOrders: vi.fn(),
  fetchRevenueSummary: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/components/OrderLink", () => ({
  OrderLink: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const order: Order = {
  id: "ord_1012",
  number: "ORD-1012",
  customer: "Mila Novak",
  status: "Pending",
  placedAt: "2026-10-12T20:27:00Z",
  total: 157.5,
  lineItems: [],
};

beforeEach(() => {
  vi.mocked(getSessionTokens).mockResolvedValue({ accessToken: "t" });
  vi.mocked(fetchRecentOrders).mockResolvedValue([order]);
  vi.mocked(fetchRevenueSummary).mockResolvedValue({ totalRevenue: 157.5, orderCount: 1, averageOrderValue: 157.5 });
});

describe("Dashboard page", () => {
  it("marks Data visible with an inline script right after the server-rendered Orders, before hydration", async () => {
    const html = renderToString(await DashboardPage({ searchParams: Promise.resolve({}) }));

    const orders = html.indexOf("ORD-1012");
    expect(orders).toBeGreaterThan(-1);
    expect(html.indexOf(`<script>${dataVisibleScript}</script>`)).toBeGreaterThan(orders);
  });
});
