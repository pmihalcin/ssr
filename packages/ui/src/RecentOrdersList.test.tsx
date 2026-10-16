import { render, screen, within } from "@testing-library/react";
import { RecentOrdersList } from "./RecentOrdersList";
import type { Order } from "./orders";

const orders: Order[] = [
  {
    id: "ord_1012",
    number: "ORD-1012",
    customer: "Mila Novak",
    status: "Pending",
    placedAt: "2026-10-12T20:27:00Z",
    total: 157.5,
    lineItems: [],
  },
  {
    id: "ord_1011",
    number: "ORD-1011",
    customer: "Oliver Hughes",
    status: "Delivered",
    placedAt: "2026-10-10T16:09:00Z",
    total: 219,
    lineItems: [],
  },
];

describe("RecentOrdersList", () => {
  it("renders one row per order, in the given order", () => {
    render(<RecentOrdersList orders={orders} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("ORD-1012")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("ORD-1011")).toBeInTheDocument();
  });

  it("shows customer, status, date and total for each order", () => {
    render(<RecentOrdersList orders={orders} />);

    const row = screen.getAllByRole("row")[1]!;
    expect(within(row).getByText("Mila Novak")).toBeInTheDocument();
    expect(within(row).getByText("Pending")).toBeInTheDocument();
    expect(within(row).getByText("12 Oct 2026")).toBeInTheDocument();
    expect(within(row).getByText("$157.50")).toBeInTheDocument();
  });

  it("shows an empty message when there are no orders", () => {
    render(<RecentOrdersList orders={[]} />);

    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("links each order number to its detail page", () => {
    render(<RecentOrdersList orders={orders} />);

    expect(screen.getByRole("link", { name: "ORD-1012" })).toHaveAttribute("href", "/orders/ord_1012");
  });

  it("uses the given link component for the order links", () => {
    const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href} data-custom>
        {children}
      </a>
    );
    render(<RecentOrdersList orders={orders} Link={Link} />);

    expect(screen.getByRole("link", { name: "ORD-1011" })).toHaveAttribute("data-custom");
  });
});
