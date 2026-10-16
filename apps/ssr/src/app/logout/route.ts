import { NextResponse } from "next/server";
import { getSessionTokens, keycloakLogoutUrl, signOut } from "@/auth";

export async function POST() {
  const tokens = await getSessionTokens();
  await signOut({ redirect: false });

  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const url = new URL(keycloakLogoutUrl);
  url.searchParams.set("post_logout_redirect_uri", appUrl);
  url.searchParams.set("client_id", process.env.KEYCLOAK_CLIENT_ID ?? "ssr-app");
  if (typeof tokens?.idToken === "string") url.searchParams.set("id_token_hint", tokens.idToken);
  return NextResponse.redirect(url, 303);
}
