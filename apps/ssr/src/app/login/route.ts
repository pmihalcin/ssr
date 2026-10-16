import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const returnUrl = new URL(request.url).searchParams.get("returnUrl") ?? "/";
  // Only local paths, so login can't be used as an open redirect.
  const redirectTo = returnUrl.startsWith("/") && !returnUrl.startsWith("//") ? returnUrl : "/";
  return signIn("keycloak", { redirectTo });
}
