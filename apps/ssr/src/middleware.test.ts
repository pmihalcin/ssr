import { describe, expect, it, vi } from "vitest";
import { NextRequest, type NextFetchEvent } from "next/server";
import { middleware } from "./middleware";

vi.mock("@/auth", () => ({
  auth: () => async () =>
    new Response(null, { headers: [["set-cookie", "authjs.session-token=refreshed; Path=/; HttpOnly"]] }),
}));

describe("middleware", () => {
  it("lets the page rendered in the same request read the refreshed session cookie", async () => {
    const request = new NextRequest("http://localhost:3000/", { headers: { cookie: "authjs.session-token=stale" } });

    const response = await middleware(request, {} as NextFetchEvent);

    expect(response.headers.get("x-middleware-override-headers")).toContain("cookie");
    expect(response.headers.get("x-middleware-request-cookie")).toBe("authjs.session-token=refreshed");
    expect(response.headers.getSetCookie()).toEqual(["authjs.session-token=refreshed; Path=/; HttpOnly"]);
  });
});
