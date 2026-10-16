import { getToken, type JWT } from "next-auth/jwt";
import NextAuth from "next-auth";
import { headers } from "next/headers";

const publicIssuer = process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/ssr";
// Containers reach Keycloak on its service name, while the browser uses the public issuer.
const internalIssuer = process.env.KEYCLOAK_INTERNAL_ISSUER ?? publicIssuer;
const oidc = "protocol/openid-connect";

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
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "ssr-app",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "ssr-app-secret",
      authorization: { url: `${publicIssuer}/${oidc}/auth`, params: { scope: "openid profile email" } },
      token: `${internalIssuer}/${oidc}/token`,
      userinfo: `${internalIssuer}/${oidc}/userinfo`,
      checks: ["pkce", "state"],
    },
  ],
  callbacks: {
    // The tokens live only in Auth.js's encrypted session cookie. The session callback is
    // left at its default so /api/auth/session never exposes them to the browser.
    jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
  },
});

/** Reads the tokens from the encrypted session cookie, on the server only. */
export async function getSessionTokens(): Promise<JWT | null> {
  return getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    salt: sessionCookie,
    secureCookie: secureCookies,
  });
}

export const keycloakLogoutUrl = `${publicIssuer}/${oidc}/logout`;
