import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { applySetCookies } from "@/lib/session-cookies";

// Runs Auth.js on page requests so the jwt callback refreshes the access token and the
// renewed tokens are written back to the encrypted session cookie.
const session = auth((_request: NextAuthRequest, _event: NextFetchEvent) => undefined);

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const response = await session(request, event);
  const setCookies = response?.headers.getSetCookie() ?? [];
  // The page reads the tokens from the request, so it must see the renewed cookie too;
  // otherwise it would call the API with the token that has just expired.
  const headers = new Headers(request.headers);
  headers.set("cookie", applySetCookies(request.headers.get("cookie") ?? "", setCookies));
  const next = NextResponse.next({ request: { headers } });
  for (const cookie of setCookies) next.headers.append("set-cookie", cookie);
  return next;
}

export const config = {
  matcher: ["/((?!api/auth|login|logout|_next/static|_next/image|favicon.ico).*)"],
};
