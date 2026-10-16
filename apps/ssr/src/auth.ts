import { getToken, type JWT } from "next-auth/jwt";
import NextAuth from "next-auth";
import { headers } from "next/headers";
import { keepFresh, type TokenSet } from "@/lib/refresh";

const publicIssuer = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/ssr";
// Containers reach Keycloak on its service name, while the browser uses the public issuer.
const internalIssuer = process.env.KEYCLOAK_INTERNAL_ISSUER ?? publicIssuer;
const oidc = "protocol/openid-connect";
const tokenUrl = `${internalIssuer}/${oidc}/token`;
const clientId = process.env.KEYCLOAK_CLIENT_ID ?? "ssr-app";
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET ?? "ssr-app-secret";

export const secureCookies = (process.env.AUTH_URL ?? "").startsWith("https://");
const sessionCookie = `${secureCookies ? "__Secure-" : ""}authjs.session-token`;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies: secureCookies,
  providers: [
    {
      id: "keycloak",
      name: "Keycloak",
      type: "oidc",
      issuer: publicIssuer,
      clientId,
      clientSecret,
      authorization: { url: `${publicIssuer}/${oidc}/auth`, params: { scope: "openid profile email" } },
      token: tokenUrl,
      userinfo: `${internalIssuer}/${oidc}/userinfo`,
      checks: ["pkce", "state"],
    },
  ],
  callbacks: {
    // The tokens live only in Auth.js's encrypted session cookie. The session callback is
    // left at its default so /api/auth/session never exposes them to the browser.
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
        return token;
      }
      return keepFresh(token as JWT & TokenSet, { tokenUrl, clientId, clientSecret });
    },
  },
});

/** Reads the tokens from the encrypted session cookie, on the server only. */
export async function getSessionTokens(): Promise<JWT | null> {
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    salt: sessionCookie,
    secureCookie: secureCookies,
  });
  // A failed refresh means the user has to log in again.
  return token?.error ? null : token;
}

export const keycloakLogoutUrl = `${publicIssuer}/${oidc}/logout`;
