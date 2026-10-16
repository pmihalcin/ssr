/**
 * Applies a response's Set-Cookie headers to a request's Cookie header, so the rest of the
 * request sees cookies that were renewed earlier in it. Cleared or expired cookies are dropped.
 */
export function applySetCookies(cookieHeader: string, setCookies: string[]): string {
  const cookies = new Map(
    cookieHeader
      .split(";")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map(splitPair),
  );
  for (const setCookie of setCookies) {
    const [pair = "", ...attributes] = setCookie.split(";").map((part) => part.trim());
    const [name, value] = splitPair(pair);
    if (value === "" || attributes.some(isExpiry)) cookies.delete(name);
    else cookies.set(name, value);
  }
  return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
}

function splitPair(pair: string): [name: string, value: string] {
  const at = pair.indexOf("=");
  return at < 0 ? [pair, ""] : [pair.slice(0, at), pair.slice(at + 1)];
}

function isExpiry(attribute: string): boolean {
  const [name, value] = splitPair(attribute);
  switch (name.toLowerCase()) {
    case "max-age":
      return Number(value) <= 0;
    case "expires":
      return Date.parse(value) <= Date.now();
    default:
      return false;
  }
}
