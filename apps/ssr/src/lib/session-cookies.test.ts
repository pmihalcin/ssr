import { describe, expect, it } from "vitest";
import { applySetCookies } from "./session-cookies";

describe("applySetCookies", () => {
  it("replaces a cookie the response renews and keeps the others", () => {
    expect(applySetCookies("theme=dark; authjs.session-token=old", ["authjs.session-token=new; Path=/; HttpOnly"])).toBe(
      "theme=dark; authjs.session-token=new",
    );
  });

  it("adds a cookie the request didn't have", () => {
    expect(applySetCookies("", ["authjs.session-token=new; Path=/"])).toBe("authjs.session-token=new");
  });

  it("drops a cookie the response clears", () => {
    expect(
      applySetCookies("authjs.session-token.0=a; authjs.session-token.1=b", [
        "authjs.session-token.1=; Max-Age=0; Path=/",
        "authjs.session-token.0=c; Path=/",
      ]),
    ).toBe("authjs.session-token.0=c");
  });

  it("drops a cookie the response expires", () => {
    expect(applySetCookies("a=1", ["a=1; Expires=Thu, 01 Jan 1970 00:00:00 GMT"])).toBe("");
  });
});
