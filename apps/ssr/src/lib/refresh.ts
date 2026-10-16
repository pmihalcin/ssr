export type TokenSet = {
  accessToken?: string;
  refreshToken?: string;
  /** Seconds since the epoch. */
  expiresAt?: number;
  error?: "RefreshTokenError";
};

const refreshWindowSeconds = 30;

export const nowInSeconds = () => Math.floor(Date.now() / 1000);

export function needsRefresh(token: TokenSet, now = nowInSeconds()): boolean {
  return typeof token.expiresAt === "number" && token.expiresAt - now <= refreshWindowSeconds;
}

/**
 * Trades the refresh token for new tokens. A rejected refresh (expired refresh token,
 * revoked session) yields a token without an access token and with `error` set, so the
 * app sends the user back through login instead of retrying.
 */
export async function refreshTokens(
  token: TokenSet,
  options: { tokenUrl: string; clientId: string; clientSecret: string; fetch?: typeof fetch; now?: number },
): Promise<TokenSet> {
  const failed: TokenSet = { ...token, accessToken: undefined, error: "RefreshTokenError" };
  if (!token.refreshToken) return failed;
  try {
    const response = await (options.fetch ?? fetch)(options.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
        client_id: options.clientId,
        client_secret: options.clientSecret,
      }).toString(),
    });
    if (!response.ok) return failed;
    const body = (await response.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token ?? token.refreshToken,
      expiresAt: (options.now ?? nowInSeconds()) + body.expires_in,
    };
  } catch {
    return failed;
  }
}
