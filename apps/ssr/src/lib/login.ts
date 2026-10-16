/** Where to send a visitor without a session so they come back to `returnTo` once logged in. */
export function loginUrl(returnTo: string): string {
  return `/login?returnUrl=${encodeURIComponent(returnTo)}`;
}
