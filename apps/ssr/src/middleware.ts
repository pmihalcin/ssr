// Runs Auth.js on page requests so the jwt callback refreshes the access token and the
// renewed tokens are written back to the encrypted session cookie.
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api/auth|login|logout|_next/static|_next/image|favicon.ico).*)"],
};
