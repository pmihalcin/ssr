import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

const order = {
  id: "ord_1012",
  number: "ORD-1012",
  customer: "Mila Novak",
  status: "Pending",
  placedAt: "2026-10-12T20:27:00Z",
  total: 157.5,
  lineItems: [{ product: "Mechanical keyboard", quantity: 1, unitPrice: 129 }],
};

function stubApi() {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/api/orders/recent") return Response.json([order]);
    if (url === "/api/orders/summary") return Response.json({ totalRevenue: 1, orderCount: 1, averageOrderValue: 1 });
    if (url === "/api/orders/ord_1012") return Response.json(order);
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("App routing", () => {
  it("opens an order from the Dashboard without reloading the page, and comes back", async () => {
    stubApi();
    const marker = Symbol();
    (window as unknown as Record<symbol, unknown>)[marker] = true;
    render(<App />);

    await userEvent.click(await screen.findByRole("link", { name: "ORD-1012" }));

    expect(await screen.findByText("Mechanical keyboard")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/orders/ord_1012");

    await userEvent.click(screen.getByRole("link", { name: /Back to the Dashboard/ }));

    expect(await screen.findByText("Recent orders")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
    expect((window as unknown as Record<symbol, unknown>)[marker]).toBe(true);
  });

  it("goes back to the Dashboard with the browser's back button", async () => {
    stubApi();
    render(<App />);
    await userEvent.click(await screen.findByRole("link", { name: "ORD-1012" }));
    await screen.findByText("Mechanical keyboard");

    act(() => {
      window.history.back();
    });

    expect(await screen.findByText("Recent orders")).toBeInTheDocument();
  });

  it("renders a deep link straight to an order", async () => {
    window.history.replaceState(null, "", "/orders/ord_1012");
    const fetchMock = stubApi();

    render(<App />);

    expect(await screen.findByText("Mechanical keyboard")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/orders/ord_1012", expect.anything());
  });

  it("shows a not-found state for an unknown order", async () => {
    window.history.replaceState(null, "", "/orders/nope");
    stubApi();

    render(<App />);

    expect(await screen.findByText("Order not found.")).toBeInTheDocument();
  });

  it("keeps the page's ?latency on client-side navigation", async () => {
    window.history.replaceState(null, "", "/?latency=1500");
    stubApi();
    render(<App />);

    await userEvent.click(await screen.findByRole("link", { name: "ORD-1012" }));

    expect(window.location.search).toBe("?latency=1500");
  });
});
