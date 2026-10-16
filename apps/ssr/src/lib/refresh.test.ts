import { describe, expect, it, vi } from "vitest";
import { keepFresh, needsRefresh, refreshTokens, type TokenSet } from "./refresh";

const endpoint = { tokenUrl: "http://kc/token", clientId: "ssr-app", clientSecret: "secret" };
const now = 1_000_000;
const stale: TokenSet = { accessToken: "old", refreshToken: "r1", expiresAt: now + 10 };

const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("needsRefresh", () => {
  it("refreshes when the access token expires within 30 seconds", () => {
    expect(needsRefresh({ expiresAt: now + 30 }, now)).toBe(true);
    expect(needsRefresh({ expiresAt: now + 31 }, now)).toBe(false);
  });
});

describe("refreshTokens", () => {
  it("exchanges the refresh token and stores the new tokens", async () => {
    const fetch = respond(200, { access_token: "new", refresh_token: "r2", expires_in: 300 });

    const result = await refreshTokens(stale, { ...endpoint, fetch, now });

    expect(result).toEqual({ accessToken: "new", refreshToken: "r2", expiresAt: now + 300 });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://kc/token");
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("r1");
    expect(body.get("client_id")).toBe("ssr-app");
  });

  it("keeps the old refresh token when Keycloak doesn't rotate it", async () => {
    const fetch = respond(200, { access_token: "new", expires_in: 300 });
    expect((await refreshTokens(stale, { ...endpoint, fetch, now })).refreshToken).toBe("r1");
  });

  it("flags an error and drops the access token when the refresh is rejected", async () => {
    const result = await refreshTokens(stale, { ...endpoint, fetch: respond(400, { error: "invalid_grant" }), now });

    expect(result.error).toBe("RefreshTokenError");
    expect(result.accessToken).toBeUndefined();
  });

  it("flags an error when there is no refresh token", async () => {
    const fetch = vi.fn();
    const result = await refreshTokens({ accessToken: "old", expiresAt: now }, { ...endpoint, fetch, now });

    expect(result.error).toBe("RefreshTokenError");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("keepFresh", () => {
  it("leaves a token with plenty of lifetime left alone", async () => {
    const fetch = vi.fn();
    const token = { accessToken: "current", refreshToken: "r1", expiresAt: now + 240 };

    expect(await keepFresh(token, { ...endpoint, fetch, now })).toBe(token);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes a token about to expire and keeps the rest of the session", async () => {
    const fetch = respond(200, { access_token: "new", refresh_token: "r2", expires_in: 300 });

    const result = await keepFresh({ ...stale, idToken: "id", sub: "user" }, { ...endpoint, fetch, now });

    expect(result).toEqual({ accessToken: "new", refreshToken: "r2", expiresAt: now + 300, idToken: "id", sub: "user" });
  });

  it("flags an error on the session when the refresh is rejected", async () => {
    const fetch = respond(400, { error: "invalid_grant" });

    const result = await keepFresh({ ...stale, idToken: "id" }, { ...endpoint, fetch, now });

    expect(result).toMatchObject({ error: "RefreshTokenError", idToken: "id" });
    expect(result.accessToken).toBeUndefined();
  });
});
