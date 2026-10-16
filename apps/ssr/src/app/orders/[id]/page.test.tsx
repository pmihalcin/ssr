import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionTokens } from "@/auth";
import { fetchOrder, UnauthorizedError } from "@/lib/orders";
import OrderPage from "./page";

vi.mock("@/auth", () => ({ getSessionTokens: vi.fn() }));
vi.mock("@/lib/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/orders")>()),
  fetchOrder: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));

function render(id: string, latency?: string) {
  return OrderPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ latency }) });
}

beforeEach(() => {
  vi.mocked(getSessionTokens).mockReset();
  vi.mocked(fetchOrder).mockReset();
});

describe("Order detail page", () => {
  it("sends a deep link without a session to login and back to the same order", async () => {
    vi.mocked(getSessionTokens).mockResolvedValue(null);

    await expect(render("ord_1012", "1500")).rejects.toThrow(
      "redirect:/login?returnUrl=%2Forders%2Ford_1012%3Flatency%3D1500",
    );
    expect(fetchOrder).not.toHaveBeenCalled();
  });

  it("sends an expired session to login and back to the same order", async () => {
    vi.mocked(getSessionTokens).mockResolvedValue({ accessToken: "t" });
    vi.mocked(fetchOrder).mockRejectedValue(new UnauthorizedError());

    await expect(render("ord_1012")).rejects.toThrow("redirect:/login?returnUrl=%2Forders%2Ford_1012");
  });

  it("uses Next's notFound() for an unknown id", async () => {
    vi.mocked(getSessionTokens).mockResolvedValue({ accessToken: "t" });
    vi.mocked(fetchOrder).mockResolvedValue(null);

    await expect(render("nope")).rejects.toThrow("notFound");
  });

  it("fetches the order with the session's access token and the page's latency", async () => {
    vi.mocked(getSessionTokens).mockResolvedValue({ accessToken: "t" });
    vi.mocked(fetchOrder).mockResolvedValue({
      id: "ord_1012",
      number: "ORD-1012",
      customer: "Mila Novak",
      status: "Pending",
      placedAt: "2026-10-12T20:27:00Z",
      total: 157.5,
      lineItems: [],
    });

    await render("ord_1012", "1500");

    expect(fetchOrder).toHaveBeenCalledWith("t", "ord_1012", expect.objectContaining({ latency: "1500" }));
  });
});
