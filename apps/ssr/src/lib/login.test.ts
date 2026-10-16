import { describe, expect, it } from "vitest";
import { withLatency } from "@ssr/ui";
import { loginUrl } from "./login";

describe("loginUrl", () => {
  it("returns to the page after login", () => {
    expect(loginUrl("/")).toBe("/login?returnUrl=%2F");
  });

  it("keeps the page's latency across the login", () => {
    expect(loginUrl(withLatency("/", "1500"))).toBe("/login?returnUrl=%2F%3Flatency%3D1500");
  });
});
