import { render, screen, waitFor } from "@testing-library/react";
import type { Order } from "@ssr/ui";
import { Dashboard } from "./Dashboard";

const order: Order = {
  id: "ord_1012",
  number: "ORD-1012",
  customer: "Mila Novak",
  status: "Pending",
  placedAt: "2026-10-12T20:27:00Z",
  total: 157.5,
  lineItems: [],
};

const summary = { totalRevenue: 3198.3, orderCount: 12, averageOrderValue: 266.53 };

function respondWith(status: number, body: unknown = []) {
  const fetchMock = vi.fn(async (url: string) =>
    status === 200 && url.endsWith("/summary")
      ? Response.json(summary)
      : new Response(JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("Dashboard", () => {
  it("fetches recent orders from the same-origin /api and lists them", async () => {
    const fetchMock = respondWith(200, [order]);

    render(<Dashboard />);

    expect(await screen.findByText("ORD-1012")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/orders/recent", expect.anything());
  });

  it("fetches the revenue summary through the BFF and shows it", async () => {
    const fetchMock = respondWith(200, [order]);

    render(<Dashboard />);

    expect(await screen.findByText("$3,198.30")).toBeInTheDocument();
    expect(screen.getByText("$266.53")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/orders/summary", expect.anything());
  });

  it("shows a loading state before the orders arrive", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    render(<Dashboard />);

    expect(screen.getByText("Loading orders…")).toBeInTheDocument();
  });

  it("shows an error when the request fails", async () => {
    respondWith(500);

    render(<Dashboard />);

    expect(await screen.findByText("Could not load orders.")).toBeInTheDocument();
  });

  it("starts the login again when the session has expired", async () => {
    respondWith(401);
    const redirect = vi.fn();

    render(<Dashboard onSessionExpired={redirect} />);

    await waitFor(() => expect(redirect).toHaveBeenCalled());
  });

  it("logs out by posting to the BFF", () => {
    respondWith(200);

    render(<Dashboard />);

    const form = screen.getByRole("button", { name: "Log out" }).closest("form")!;
    expect(form).toHaveAttribute("action", "/bff/logout");
    expect(form).toHaveAttribute("method", "post");
  });
});
