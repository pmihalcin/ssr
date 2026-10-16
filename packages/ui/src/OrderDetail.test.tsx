import { render, screen, within } from "@testing-library/react";
import { OrderDetail, OrderNotFound } from "./OrderDetail";
import type { Order } from "./orders";

const order: Order = {
  id: "ord_1012",
  number: "ORD-1012",
  customer: "Mila Novak",
  status: "Pending",
  placedAt: "2026-10-12T20:27:00Z",
  total: 157.5,
  lineItems: [
    { product: "Mechanical keyboard", quantity: 1, unitPrice: 129 },
    { product: "USB-C cable", quantity: 3, unitPrice: 9.5 },
  ],
};

describe("OrderDetail", () => {
  it("shows the order's number, status and total", () => {
    render(<OrderDetail order={order} />);

    expect(screen.getByRole("heading", { name: "ORD-1012" })).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("$157.50")).toBeInTheDocument();
  });

  it("lists each Line Item with product, quantity and price", () => {
    render(<OrderDetail order={order} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[1]!).getByText("USB-C cable")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("3")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("$9.50")).toBeInTheDocument();
  });

  it("links back to the Dashboard with the given link component", () => {
    const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
      <a href={href} data-custom>
        {children}
      </a>
    );
    render(<OrderDetail order={order} Link={Link} />);

    const back = screen.getByRole("link", { name: /Back to the Dashboard/ });
    expect(back).toHaveAttribute("href", "/");
    expect(back).toHaveAttribute("data-custom");
  });
});

describe("OrderNotFound", () => {
  it("says the order was not found and links back", () => {
    render(<OrderNotFound />);

    expect(screen.getByText("Order not found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to the Dashboard/ })).toHaveAttribute("href", "/");
  });
});
