import { describe, expect, it, vi } from "vitest";
import { fetchOrder, fetchRecentOrders, fetchRevenueSummary, UnauthorizedError } from "./orders";

const baseUrl = "http://api:8080";

describe("fetchRecentOrders", () => {
  it("calls the API's recent orders endpoint with the access token", async () => {
    const orders = [{ id: "1", number: "ORD-1" }];
    const fetchMock = vi.fn(async () => Response.json(orders));

    const result = await fetchRecentOrders("secret-token", { baseUrl, fetch: fetchMock as typeof fetch });

    expect(result).toEqual(orders);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("http://api:8080/orders/recent");
    expect(init.headers).toEqual({ Authorization: "Bearer secret-token" });
  });

  it("throws UnauthorizedError when the API answers 401", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 401 }));
    await expect(fetchRecentOrders("t", { baseUrl, fetch: fetchMock as typeof fetch })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("throws on other failures", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 500 }));
    await expect(fetchRecentOrders("t", { baseUrl, fetch: fetchMock as typeof fetch })).rejects.toThrow("500");
  });
});

describe("fetchRevenueSummary", () => {
  it("calls the API's summary endpoint with the access token", async () => {
    const summary = { totalRevenue: 10, orderCount: 2, averageOrderValue: 5 };
    const fetchMock = vi.fn(async () => Response.json(summary));

    const result = await fetchRevenueSummary("secret-token", { baseUrl, fetch: fetchMock as typeof fetch });

    expect(result).toEqual(summary);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("http://api:8080/orders/summary");
    expect(init.headers).toEqual({ Authorization: "Bearer secret-token" });
  });

  it("throws UnauthorizedError when the API answers 401", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 401 }));
    await expect(fetchRevenueSummary("t", { baseUrl, fetch: fetchMock as typeof fetch })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("Simulated Latency", () => {
  it("passes the page's latency on to the orders request", async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    await fetchRecentOrders("t", { baseUrl, latency: "1500", fetch: fetchMock as typeof fetch });
    const [, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(init.headers).toMatchObject({ "X-Simulated-Latency": "1500" });
  });

  it("passes the page's latency on to the summary request", async () => {
    const fetchMock = vi.fn(async () => Response.json({}));
    await fetchRevenueSummary("t", { baseUrl, latency: "1500", fetch: fetchMock as typeof fetch });
    const [, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(init.headers).toMatchObject({ "X-Simulated-Latency": "1500" });
  });
});

describe("fetchOrder", () => {
  it("calls the API's order endpoint with the access token", async () => {
    const order = { id: "ord_1", number: "ORD-1" };
    const fetchMock = vi.fn(async () => Response.json(order));

    const result = await fetchOrder("secret-token", "ord_1", { baseUrl, fetch: fetchMock as typeof fetch });

    expect(result).toEqual(order);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("http://api:8080/orders/ord_1");
    expect(init.headers).toEqual({ Authorization: "Bearer secret-token" });
  });

  it("resolves to null when the API answers 404", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(fetchOrder("t", "nope", { baseUrl, fetch: fetchMock as typeof fetch })).resolves.toBeNull();
  });

  it("throws UnauthorizedError when the API answers 401", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 401 }));
    await expect(fetchOrder("t", "x", { baseUrl, fetch: fetchMock as typeof fetch })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("passes the page's latency on", async () => {
    const fetchMock = vi.fn(async () => Response.json({}));
    await fetchOrder("t", "x", { baseUrl, latency: "1500", fetch: fetchMock as typeof fetch });
    const [, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(init.headers).toMatchObject({ "X-Simulated-Latency": "1500" });
  });
});
